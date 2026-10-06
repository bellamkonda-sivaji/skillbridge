package com.skillbridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
// Push notifications go out on their own thread: nothing a user does should
// wait on Google, and nothing should fail because Google did not answer.
@EnableAsync
@org.springframework.scheduling.annotation.EnableScheduling
public class SkillBridgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillBridgeApplication.class, args);
    }
}
