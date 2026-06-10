package com.byke.service;

import com.byke.dto.EarningsSummary;
import com.byke.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EarningsServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private EarningsService earningsService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(earningsService, "subscriptionAmount", 100.0);
    }

    @Test
    void testGetTodayEarnings() {
        when(bookingRepository.sumEarningsByRiderAndDateRange(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(500.0);
        when(bookingRepository.countCompletedTripsByRiderAndDateRange(eq(1L), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(5L);

        EarningsSummary summary = earningsService.getTodayEarnings(1L);

        assertEquals(500.0, summary.getTotalEarnings());
        assertEquals(5L, summary.getCompletedTrips());
        assertEquals(100.0, summary.getAverageFare());
        assertEquals(0.0, summary.getSubscriptionCost()); // Daily view has 0 sub cost
        assertEquals(500.0, summary.getNetEarnings());
    }

    @Test
    void testGetOverallEarningsSummary() {
        when(bookingRepository.sumTotalEarningsByRider(1L)).thenReturn(1000.0);
        when(bookingRepository.countTotalCompletedTripsByRider(1L)).thenReturn(10L);

        EarningsSummary summary = earningsService.getOverallEarningsSummary(1L);

        assertEquals(1000.0, summary.getTotalEarnings());
        assertEquals(10L, summary.getCompletedTrips());
        assertEquals(100.0, summary.getAverageFare());
        assertEquals(100.0, summary.getSubscriptionCost());
        assertEquals(900.0, summary.getNetEarnings());
    }
}
