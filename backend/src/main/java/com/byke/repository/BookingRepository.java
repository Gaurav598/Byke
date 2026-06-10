package com.byke.repository;

import com.byke.model.entity.Booking;
import com.byke.model.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByRiderId(Long riderId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByUserIdAndStatus(Long userId, BookingStatus status);
    List<Booking> findByRiderIdAndStatus(Long riderId, BookingStatus status);
    List<Booking> findByUserIdAndStatusIn(Long userId, List<BookingStatus> statuses);
    List<Booking> findByRiderIdAndStatusIn(Long riderId, List<BookingStatus> statuses);
    List<Booking> findTop50ByRiderIdAndStatusOrderByCompletedAtDesc(Long riderId, BookingStatus status);
    long countByStatus(BookingStatus status);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query(value = "SELECT * FROM bookings b WHERE b.status = :status AND ST_DWithin(b.pickup_location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)", nativeQuery = true)
    List<Booking> findBookingsWithinRadius(@Param("status") String status, @Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);

    @Query("SELECT COALESCE(SUM(b.finalFare), 0.0) FROM Booking b WHERE b.rider.id = :riderId AND b.status = 'COMPLETED' AND b.completedAt BETWEEN :startDate AND :endDate")
    Double sumEarningsByRiderAndDateRange(@Param("riderId") Long riderId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.rider.id = :riderId AND b.status = 'COMPLETED' AND b.completedAt BETWEEN :startDate AND :endDate")
    Long countCompletedTripsByRiderAndDateRange(@Param("riderId") Long riderId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(b.finalFare), 0.0) FROM Booking b WHERE b.rider.id = :riderId AND b.status = 'COMPLETED'")
    Double sumTotalEarningsByRider(@Param("riderId") Long riderId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.rider.id = :riderId AND b.status = 'COMPLETED'")
    Long countTotalCompletedTripsByRider(@Param("riderId") Long riderId);
}
