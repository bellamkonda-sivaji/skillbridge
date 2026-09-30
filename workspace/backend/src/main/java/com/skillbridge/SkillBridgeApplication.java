package com.skillbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class SkillBridgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillBridgeApplication.class, args);
    }
}
