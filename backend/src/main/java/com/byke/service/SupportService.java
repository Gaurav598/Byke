package com.byke.service;

import com.byke.model.entity.SupportTicket;
import com.byke.model.entity.SupportTicketReply;
import com.byke.model.entity.User;
import com.byke.model.entity.Rider;
import com.byke.model.entity.Booking;
import com.byke.model.enums.TicketCategory;
import com.byke.model.enums.TicketPriority;
import com.byke.model.enums.TicketStatus;
import com.byke.repository.SupportTicketReplyRepository;
import com.byke.repository.SupportTicketRepository;
import com.byke.repository.UserRepository;
import com.byke.repository.RiderRepository;
import com.byke.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportService {

    private final SupportTicketRepository ticketRepository;
    private final SupportTicketReplyRepository replyRepository;
    private final UserRepository userRepository;
    private final RiderRepository riderRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Transactional
    public SupportTicket createTicket(Long creatorId, String creatorType, Long bookingId, String categoryStr, String title, String description) {
        User user = null;
        Rider rider = null;
        Booking booking = null;

        if ("USER".equalsIgnoreCase(creatorType)) {
            user = userRepository.findById(creatorId).orElseThrow(() -> new RuntimeException("User not found"));
        } else if ("RIDER".equalsIgnoreCase(creatorType)) {
            rider = riderRepository.findById(creatorId).orElseThrow(() -> new RuntimeException("Rider not found"));
        }

        if (bookingId != null) {
            booking = bookingRepository.findById(bookingId).orElse(null);
        }

        TicketCategory category = TicketCategory.valueOf(categoryStr.toUpperCase());
        TicketPriority priority = TicketPriority.NORMAL;
        if (category == TicketCategory.PAYMENT_ISSUE || category == TicketCategory.TECHNICAL_ISSUE) {
            priority = TicketPriority.HIGH;
        }

        SupportTicket ticket = SupportTicket.builder()
                .ticketId("TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .user(user)
                .rider(rider)
                .booking(booking)
                .category(category)
                .title(title)
                .description(description)
                .status(TicketStatus.OPEN)
                .priority(priority)
                .createdAt(LocalDateTime.now())
                .build();

        return ticketRepository.save(ticket);
    }

    public List<SupportTicket> getUserTickets(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    public List<SupportTicket> getRiderTickets(Long riderId) {
        return ticketRepository.findByRiderId(riderId);
    }

    public List<SupportTicket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public SupportTicket getTicket(String ticketId) {
        return ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    public List<SupportTicketReply> getTicketReplies(Long ticketId) {
        return replyRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public SupportTicketReply addReply(String ticketId, Long senderId, String senderType, String message) {
        SupportTicket ticket = getTicket(ticketId);
        
        SupportTicketReply reply = SupportTicketReply.builder()
                .ticket(ticket)
                .senderId(senderId)
                .senderType(senderType.toUpperCase())
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();

        SupportTicketReply savedReply = replyRepository.save(reply);
        
        ticket.setUpdatedAt(LocalDateTime.now());
        if ("ADMIN".equalsIgnoreCase(senderType) && ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticketRepository.save(ticket);

        // Send push notification
        try {
            if ("ADMIN".equalsIgnoreCase(senderType)) {
                if (ticket.getUser() != null) {
                    notificationService.notifyUserWithType(
                            ticket.getUser().getId(),
                            "Support Reply",
                            "Admin replied to your ticket: " + ticket.getTicketId(),
                            "TICKET_REPLY",
                            null
                    );
                } else if (ticket.getRider() != null) {
                    notificationService.notifyUserWithType(
                            ticket.getRider().getUser().getId(),
                            "Support Reply",
                            "Admin replied to your ticket: " + ticket.getTicketId(),
                            "TICKET_REPLY",
                            null
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to send notification for ticket reply", e);
        }

        return savedReply;
    }

    @Transactional
    public SupportTicket closeTicket(String ticketId, Long adminId, String resolution) {
        SupportTicket ticket = getTicket(ticketId);
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setUpdatedAt(LocalDateTime.now());
        
        if (resolution != null && !resolution.trim().isEmpty()) {
            addReply(ticketId, adminId, "ADMIN", "Resolution: " + resolution);
        }
        
        ticketRepository.save(ticket);

        try {
            Long recipientId = ticket.getUser() != null ? ticket.getUser().getId() : ticket.getRider().getUser().getId();
            notificationService.notifyUserWithType(
                    recipientId,
                    "Ticket Resolved",
                    "Your ticket " + ticket.getTicketId() + " has been resolved.",
                    "TICKET_RESOLVED",
                    null
            );
        } catch (Exception e) {
            log.error("Failed to send ticket resolution notification", e);
        }

        return ticket;
    }
}
