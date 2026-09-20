package com.skillbridge.controller;

import com.skillbridge.dto.WalletDto;
import com.skillbridge.dto.WalletFundRequest;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.WalletService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public WalletDto myWallet() {
        return walletService.myWallet(AuthenticationUtils.currentAccount());
    }

    @PostMapping("/fund")
    public WalletDto fund(@RequestBody WalletFundRequest request) {
        return walletService.fund(AuthenticationUtils.currentAccount(), request.amount());
    }

    @PostMapping("/withdraw")
    public WalletDto withdraw(@RequestBody WalletFundRequest request) {
        return walletService.withdraw(AuthenticationUtils.currentAccount(), request.amount());
    }
}
