package com.skillbridge.controller;

import com.skillbridge.dto.ConversationDto;
import com.skillbridge.dto.MessageDto;
import com.skillbridge.dto.SendMessageRequest;
import com.skillbridge.security.AuthenticationUtils;
import com.skillbridge.service.ChatService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public List<ConversationDto> conversations() {
        return chatService.listConversations(AuthenticationUtils.currentUser());
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public List<MessageDto> messages(@PathVariable Long conversationId) {
        return chatService.getMessages(AuthenticationUtils.currentUser(), conversationId);
    }

    @PostMapping("/send")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto send(@RequestBody SendMessageRequest request) {
        return chatService.sendMessage(AuthenticationUtils.currentUser(), request);
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public void markRead(@PathVariable Long conversationId) {
        chatService.markRead(AuthenticationUtils.currentUser(), conversationId);
    }
}
