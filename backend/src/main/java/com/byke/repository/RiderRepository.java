package com.byke.repository;

import com.byke.model.entity.Rider;
import com.byke.model.enums.RiderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiderRepository extends JpaRepository<Rider, Long> {
    Optional<Rider> findByUserId(Long userId);
    List<Rider> findByStatus(RiderStatus status);
    long countByStatus(RiderStatus status);
    
    @Query(value = "SELECT * FROM riders r WHERE r.status = :status AND " +
           "r.current_location IS NOT NULL AND " +
           "ST_DWithin(r.current_location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusKm * 1000)", nativeQuery = true)
    List<Rider> findNearbyAvailableRiders(@Param("latitude") Double latitude,
                                           @Param("longitude") Double longitude,
                                           @Param("radiusKm") Double radiusKm,
                                           @Param("status") String status);

    @Query(value = "SELECT * FROM riders r WHERE r.status = :status AND " +
           "r.vehicle_type = :vehicleType AND " +
           "r.current_location IS NOT NULL AND " +
           "ST_DWithin(r.current_location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusKm * 1000)", nativeQuery = true)
    List<Rider> findNearbyAvailableRidersByVehicleType(@Param("latitude") Double latitude,
                                                        @Param("longitude") Double longitude,
                                                        @Param("radiusKm") Double radiusKm,
                                                        @Param("status") String status,
                                                        @Param("vehicleType") String vehicleType);
}
