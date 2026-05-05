package com.byke.repository;

import com.byke.model.entity.Bid;
import com.byke.model.enums.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByBookingId(Long bookingId);
    List<Bid> findByRiderId(Long riderId);
    Optional<Bid> findByBookingIdAndRiderId(Long bookingId, Long riderId);
    List<Bid> findByBookingIdAndStatus(Long bookingId, BidStatus status);
    long countByBookingId(Long bookingId);
    void deleteByBookingId(Long bookingId);
}
