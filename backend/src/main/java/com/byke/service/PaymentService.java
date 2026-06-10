package com.byke.service;

import com.byke.model.entity.Payment;
import com.byke.model.entity.Rider;
import com.byke.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;

/**
 * PaymentService - Stripe is currently disabled.
 * All riders get a free subscription that is valid indefinitely.
 * Re-enable Stripe later once you are ready for production payments.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RiderService riderService;

    @Value("${app.subscription.amount}")
    private Double subscriptionAmount;
    
    @Value("${stripe.webhook.secret}")
    private String stripeWebhookSecret;

    /**
     * Grants the rider a free subscription immediately without any payment.
     */
    @Transactional
    public Payment createFreeSubscription(Long riderId) {
        Rider rider = riderService.getRiderById(riderId);

        LocalDateTime now = LocalDateTime.now();
        // Grant subscription for 100 years (effectively permanent for free tier)
        LocalDateTime forever = now.plusYears(100);

        Payment payment = Payment.builder()
                .rider(rider)
                .amount(0.0)
                .paymentMethod("FREE")
                .transactionId("FREE-" + riderId + "-" + System.currentTimeMillis())
                .stripeSubscriptionId(null)
                .stripeCustomerId(null)
                .status("ACTIVE")
                .periodStart(now)
                .periodEnd(forever)
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        riderService.activateSubscription(riderId, now, forever);

        log.info("Free subscription activated for rider {}", riderId);
        return savedPayment;
    }

    // --- PaymentController stubs (used by REST API) ---

    public String createSubscriptionIntent(Long riderId) {
        // Auto-activate for free and return a dummy token
        createFreeSubscription(riderId);
        return "FREE_SUBSCRIPTION_ACTIVATED";
    }

    public Payment confirmSubscription(Long riderId, String paymentIntentId) {
        return createFreeSubscription(riderId);
    }

    public void handleStripeWebhook(String payload, String signature) {
        try {
            Event event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
            
            switch (event.getType()) {
                case "payment_intent.succeeded":
                    PaymentIntent paymentIntent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
                    if (paymentIntent != null) {
                        log.info("PaymentIntent succeeded: {}", paymentIntent.getId());
                        // Add logic to activate subscription based on metadata
                    }
                    break;
                case "payment_intent.payment_failed":
                    log.error("Payment failed");
                    break;
                default:
                    log.info("Unhandled event type: {}", event.getType());
            }
        } catch (Exception e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            throw new RuntimeException("Webhook error");
        }
    }

    public String getSubscriptionStatus(Long userId) {
        return "ACTIVE";
    }

    // --- Query methods ---

    public List<Payment> getRiderPayments(Long riderId) {
        return paymentRepository.findByRiderId(riderId);
    }

    public List<Payment> getFailedPayments() {
        return paymentRepository.findByStatus("FAILED");
    }

    public long getTotalRevenueToday() {
        // No revenue while Stripe is disabled
        return 0;
    }
}
