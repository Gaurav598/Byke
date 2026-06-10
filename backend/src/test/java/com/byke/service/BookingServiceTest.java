package com.byke.service;

import com.byke.model.entity.Booking;
import com.byke.model.entity.User;
import com.byke.model.enums.BookingStatus;
import com.byke.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserService userService;

    @Mock
    private RiderService riderService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bookingService, "biddingWindowSeconds", 45);
    }

    @Test
    void testGetBookingById() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        Booking result = bookingService.getBookingById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        verify(bookingRepository, times(1)).findById(1L);
    }

    @Test
    void testUpdateBookingStatus() {
        User user = new User();
        user.setId(10L);

        Booking booking = new Booking();
        booking.setId(1L);
        booking.setUser(user);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        Booking updated = bookingService.updateBookingStatus(1L, BookingStatus.IN_PROGRESS);

        assertEquals(BookingStatus.IN_PROGRESS, updated.getStatus());
        assertNotNull(updated.getStartedAt());
        verify(bookingRepository).save(booking);
        verify(notificationService).notifyUserWithType(eq(10L), anyString(), anyString(), eq("RIDE_STARTED"), eq(1L));
    }
}
