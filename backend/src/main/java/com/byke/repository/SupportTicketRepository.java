package com.byke.repository;

import com.byke.model.entity.SupportTicket;
import com.byke.model.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    Optional<SupportTicket> findByTicketId(String ticketId);
    List<SupportTicket> findByUserId(Long userId);
    List<SupportTicket> findByRiderId(Long riderId);
    List<SupportTicket> findByStatus(TicketStatus status);
}
