package com.byke.service;

import com.byke.model.entity.Payment;
import com.byke.model.entity.Rider;
import com.byke.repository.PaymentRepository;
import com.byke.repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final RiderRepository riderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    @Value("${app.subscription.amount:100.0}")
    private Double subscriptionAmount;

    public Map<String, Object> getSubscriptionStatus(Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        Map<String, Object> status = new HashMap<>();
        status.put("active", rider.getSubscriptionActive());
        status.put("startDate", rider.getSubscriptionStartDate());
        status.put("endDate", rider.getSubscriptionEndDate());
        
        long remainingDays = 0;
        if (rider.getSubscriptionEndDate() != null) {
            remainingDays = java.time.Duration.between(LocalDateTime.now(), rider.getSubscriptionEndDate()).toDays();
        }
        status.put("remainingDays", Math.max(0, remainingDays));
        return status;
    }

    public List<Payment> getSubscriptionHistory(Long riderId) {
        return paymentRepository.findByRiderId(riderId);
    }

    @Transactional
    public Payment renewSubscription(Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        // Simulate successful payment intent and renewal
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime newEnd = (rider.getSubscriptionEndDate() != null && rider.getSubscriptionEndDate().isAfter(now)) 
                ? rider.getSubscriptionEndDate().plusMonths(1) 
                : now.plusMonths(1);

        Payment payment = Payment.builder()
                .rider(rider)
                .amount(subscriptionAmount)
                .paymentMethod("STRIPE_MOCK")
                .transactionId("RENEW-" + riderId + "-" + System.currentTimeMillis())
                .status("SUCCESS")
                .periodStart(now)
                .periodEnd(newEnd)
                .createdAt(now)
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        
        rider.setSubscriptionActive(true);
        rider.setSubscriptionStartDate(now);
        rider.setSubscriptionEndDate(newEnd);
        rider.setUpdatedAt(now);
        riderRepository.save(rider);

        try {
            notificationService.notifyUserWithType(
                    rider.getUser().getId(),
                    "Subscription Renewed",
                    "Your BYKE subscription has been successfully renewed.",
                    "SUBSCRIPTION_RENEWED",
                    null
            );
        } catch (Exception e) {
            log.error("Failed to send subscription renewal notification", e);
        }

        return savedPayment;
    }

    @Transactional
    public Map<String, String> cancelSubscription(Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        rider.setSubscriptionActive(false);
        rider.setUpdatedAt(LocalDateTime.now());
        riderRepository.save(rider);

        Map<String, String> result = new HashMap<>();
        result.put("status", "CANCELLED");
        result.put("message", "Subscription auto-renewal cancelled. You can still ride until " + rider.getSubscriptionEndDate());
        return result;
    }

    @Transactional
    public Map<String, String> reactivateSubscription(Long riderId) {
        Rider rider = riderRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        rider.setSubscriptionActive(true);
        rider.setUpdatedAt(LocalDateTime.now());
        riderRepository.save(rider);

        Map<String, String> result = new HashMap<>();
        result.put("status", "REACTIVATED");
        result.put("message", "Subscription auto-renewal reactivated.");
        return result;
    }
}
