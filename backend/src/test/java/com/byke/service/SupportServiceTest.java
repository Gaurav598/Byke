package com.byke.service;

import com.byke.model.entity.SupportTicket;
import com.byke.model.entity.SupportTicketReply;
import com.byke.model.entity.User;
import com.byke.model.enums.TicketCategory;
import com.byke.model.enums.TicketPriority;
import com.byke.model.enums.TicketStatus;
import com.byke.repository.SupportTicketReplyRepository;
import com.byke.repository.SupportTicketRepository;
import com.byke.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SupportServiceTest {

    @Mock
    private SupportTicketRepository ticketRepository;

    @Mock
    private SupportTicketReplyRepository replyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SupportService supportService;

    @Test
    void testCreateTicket() {
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(ticketRepository.save(any(SupportTicket.class))).thenAnswer(i -> i.getArguments()[0]);

        SupportTicket ticket = supportService.createTicket(1L, "USER", null, "PAYMENT_ISSUE", "Payment failed", "My payment failed.");

        assertNotNull(ticket);
        assertEquals(TicketCategory.PAYMENT_ISSUE, ticket.getCategory());
        assertEquals(TicketPriority.HIGH, ticket.getPriority());
        assertEquals(TicketStatus.OPEN, ticket.getStatus());
        assertEquals(user, ticket.getUser());
    }

    @Test
    void testAddReply() {
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketId("TKT-123");
        ticket.setStatus(TicketStatus.OPEN);
        
        User user = new User();
        user.setId(1L);
        ticket.setUser(user);

        when(ticketRepository.findByTicketId("TKT-123")).thenReturn(Optional.of(ticket));
        when(replyRepository.save(any(SupportTicketReply.class))).thenAnswer(i -> i.getArguments()[0]);

        SupportTicketReply reply = supportService.addReply("TKT-123", 2L, "ADMIN", "We are looking into this.");

        assertNotNull(reply);
        assertEquals("We are looking into this.", reply.getMessage());
        assertEquals(TicketStatus.IN_PROGRESS, ticket.getStatus());
        
        verify(notificationService, times(1)).notifyUserWithType(anyLong(), anyString(), anyString(), anyString(), any());
    }
}
