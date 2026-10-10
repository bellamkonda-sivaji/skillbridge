package com.skillbridge.repository;

import com.skillbridge.model.EmployerAccount;
import com.skillbridge.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Long> {
    List<Shop> findByEmployerAndActiveTrueOrderByPrimaryShopDescIdAsc(EmployerAccount employer);
    List<Shop> findByEmployerOrderByPrimaryShopDescIdAsc(EmployerAccount employer);
    Optional<Shop> findByIdAndEmployer(Long id, EmployerAccount employer);
    long countByEmployer(EmployerAccount employer);
}
