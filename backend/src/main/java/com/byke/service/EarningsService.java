package com.byke.service;

import com.byke.dto.EarningsSummary;
import com.byke.dto.TransactionDTO;
import com.byke.model.entity.Booking;
import com.byke.model.entity.Payment;
import com.byke.repository.BookingRepository;
import com.byke.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
@Slf4j
public class EarningsService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @Value("${app.subscription.amount:100.0}")
    private Double subscriptionAmount;

    public EarningsSummary getTodayEarnings(Long riderId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return calculateEarnings(riderId, startOfDay, endOfDay, 0.0); // No subscription cost for daily view
    }

    public EarningsSummary getWeeklyEarnings(Long riderId) {
        LocalDateTime startOfWeek = LocalDate.now().minusDays(LocalDate.now().getDayOfWeek().getValue() - 1).atStartOfDay();
        LocalDateTime endOfWeek = startOfWeek.plusDays(6).with(LocalTime.MAX);
        return calculateEarnings(riderId, startOfWeek, endOfWeek, 0.0);
    }

    public EarningsSummary getMonthlyEarnings(Long riderId) {
        LocalDateTime startOfMonth = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = YearMonth.now().atEndOfMonth().atTime(LocalTime.MAX);
        return calculateEarnings(riderId, startOfMonth, endOfMonth, subscriptionAmount);
    }

    public EarningsSummary getOverallEarningsSummary(Long riderId) {
        Double totalEarnings = bookingRepository.sumTotalEarningsByRider(riderId);
        Long completedTrips = bookingRepository.countTotalCompletedTripsByRider(riderId);
        
        Double avgFare = completedTrips > 0 ? totalEarnings / completedTrips : 0.0;
        
        return EarningsSummary.builder()
                .totalEarnings(totalEarnings)
                .completedTrips(completedTrips)
                .averageFare(avgFare)
                .subscriptionCost(subscriptionAmount) // Rough estimate for summary
                .netEarnings(totalEarnings - subscriptionAmount)
                .build();
    }

    private EarningsSummary calculateEarnings(Long riderId, LocalDateTime start, LocalDateTime end, Double subCost) {
        Double totalEarnings = bookingRepository.sumEarningsByRiderAndDateRange(riderId, start, end);
        Long completedTrips = bookingRepository.countCompletedTripsByRiderAndDateRange(riderId, start, end);

        Double avgFare = completedTrips > 0 ? totalEarnings / completedTrips : 0.0;
        Double netEarnings = totalEarnings - subCost;

        return EarningsSummary.builder()
                .totalEarnings(totalEarnings)
                .completedTrips(completedTrips)
                .averageFare(avgFare)
                .subscriptionCost(subCost)
                .netEarnings(netEarnings)
                .build();
    }

    public java.util.List<TransactionDTO> getTransactions(Long riderId) {
        java.util.List<TransactionDTO> transactions = new java.util.ArrayList<>();
        
        // Add completed rides
        java.util.List<Booking> bookings = bookingRepository.findTop50ByRiderIdAndStatusOrderByCompletedAtDesc(riderId, com.byke.model.enums.BookingStatus.COMPLETED);
        for (Booking b : bookings) {
            if (b.getFinalFare() != null && b.getFinalFare() > 0) {
                transactions.add(TransactionDTO.builder()
                        .id("B-" + b.getId())
                        .type("credit")
                        .amount(b.getFinalFare())
                        .title("Ride Earnings")
                        .subtitle("Booking #" + b.getId())
                        .bookingId(String.valueOf(b.getId()))
                        .createdAt(b.getCompletedAt())
                        .build());
            }
        }
        
        // Add subscription payments
        java.util.List<Payment> payments = paymentRepository.findByRiderId(riderId);
        for (Payment p : payments) {
            if (p.getAmount() != null && p.getAmount() > 0 && "SUCCESS".equals(p.getStatus())) {
                transactions.add(TransactionDTO.builder()
                        .id("P-" + p.getId())
                        .type("debit")
                        .amount(p.getAmount())
                        .title("Subscription Renewed")
                        .subtitle(p.getTransactionId() != null ? "Txn: " + p.getTransactionId() : "Subscription Fee")
                        .bookingId(null)
                        .createdAt(p.getCreatedAt())
                        .build());
            }
        }

        // Sort by createdAt desc
        transactions.sort((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()));
        return transactions;
    }
}
