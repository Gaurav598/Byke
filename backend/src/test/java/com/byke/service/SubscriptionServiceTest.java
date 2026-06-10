package com.byke.service;

import com.byke.model.entity.Payment;
import com.byke.model.entity.Rider;
import com.byke.model.entity.User;
import com.byke.repository.PaymentRepository;
import com.byke.repository.RiderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionServiceTest {

    @Mock
    private RiderRepository riderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(subscriptionService, "subscriptionAmount", 100.0);
    }

    @Test
    void testRenewSubscription() {
        Rider rider = new Rider();
        rider.setId(1L);
        User user = new User();
        user.setId(1L);
        rider.setUser(user);

        when(riderRepository.findById(1L)).thenReturn(Optional.of(rider));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);

        Payment payment = subscriptionService.renewSubscription(1L);

        assertNotNull(payment);
        assertEquals(100.0, payment.getAmount());
        assertEquals("SUCCESS", payment.getStatus());
        assertTrue(rider.getSubscriptionActive());
        assertNotNull(rider.getSubscriptionEndDate());
        
        verify(notificationService, times(1)).notifyUserWithType(anyLong(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void testGetSubscriptionStatus() {
        Rider rider = new Rider();
        rider.setId(1L);
        rider.setSubscriptionActive(true);
        rider.setSubscriptionEndDate(LocalDateTime.now().plusDays(11));

        when(riderRepository.findById(1L)).thenReturn(Optional.of(rider));

        Map<String, Object> status = subscriptionService.getSubscriptionStatus(1L);

        assertTrue((Boolean) status.get("active"));
        assertEquals(10L, status.get("remainingDays"));
    }
}
