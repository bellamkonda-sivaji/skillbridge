package com.skillbridge.service;

import com.skillbridge.dto.InterviewDto;
import com.skillbridge.dto.InterviewRequest;
import com.skillbridge.exception.ApiException;
import com.skillbridge.model.*;
import com.skillbridge.repository.ConversationRepository;
import com.skillbridge.repository.InterviewRepository;
import com.skillbridge.repository.JobPostRepository;
import com.skillbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final JobPostRepository jobRepository;
    private final ConversationRepository conversationRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;

    public InterviewService(InterviewRepository interviewRepository, UserRepository userRepository,
                            JobPostRepository jobRepository, ConversationRepository conversationRepository,
                            ChatService chatService, NotificationService notificationService) {
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.conversationRepository = conversationRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
    }

    @Transactional
    public InterviewDto schedule(User employer, InterviewRequest request) {
        if (request.workerId() == null || request.scheduledAt() == null || request.mode() == null) {
            throw ApiException.badRequest("Worker, scheduled time and mode are required");
        }
        User worker = userRepository.findById(request.workerId())
                .orElseThrow(() -> ApiException.notFound("Worker not found"));
        if (worker.getRole() != Role.WORKER) {
            throw ApiException.badRequest("Recipient is not a worker");
        }
        JobPost job = request.jobId() != null
                ? jobRepository.findById(request.jobId()).orElse(null) : null;
        if (job != null && !job.getEmployer().getId().equals(employer.getId())) {
            throw ApiException.forbidden("This is not your job");
        }
        Conversation conversation = request.conversationId() != null
                ? conversationRepository.findById(request.conversationId()).orElse(null)
                : null;
        if (conversation == null) {
            conversation = chatService.getOrCreateConversation(employer, worker, job);
        }

        Interview interview = Interview.builder()
                .employer(employer)
                .worker(worker)
                .job(job)
                .conversation(conversation)
                .scheduledAt(request.scheduledAt())
                .mode(request.mode())
                .location(request.location())
                .notes(request.notes())
                .status(InterviewStatus.PENDING)
                .createdBy(employer)
                .build();
        interview = interviewRepository.save(interview);

        chatService.sendMessage(employer,
                new com.skillbridge.dto.SendMessageRequest(conversation.getId(), null, null,
                        "Interview invitation: " + request.mode().name().replace("_", " ")
                                + (request.location() != null ? " at " + request.location() : "")
                                + " on " + request.scheduledAt().toString().replace("T", " ")
                                + (request.notes() != null ? ". " + request.notes() : "")));
        notificationService.notify(worker, "Interview invitation",
                employer.getName() + " invited you to an interview" +
                        (job != null ? " for \"" + job.getTitle() + "\"" : ""),
                NotificationType.INTERVIEW, "/worker/interviews");
        return InterviewDto.from(interview);
    }

    @Transactional
    public InterviewDto respond(User user, Long interviewId, InterviewStatus status) {
        if (status != InterviewStatus.CONFIRMED && status != InterviewStatus.CANCELLED) {
            throw ApiException.badRequest("You can only confirm or cancel an interview");
        }
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!interview.getWorker().getId().equals(user.getId())
                && !interview.getEmployer().getId().equals(user.getId())) {
            throw ApiException.forbidden("Not your interview");
        }
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            throw ApiException.badRequest("Interview already completed");
        }
        interview.setStatus(status);
        interviewRepository.save(interview);

        User other = interview.getWorker().getId().equals(user.getId())
                ? interview.getEmployer() : interview.getWorker();
        notificationService.notify(other, "Interview " + status.name().toLowerCase(),
                user.getName() + " " + status.name().toLowerCase()
                        + " the interview for \"" + (interview.getJob() != null ? interview.getJob().getTitle() : "the position") + "\"",
                NotificationType.INTERVIEW,
                other.getRole() == Role.WORKER ? "/worker/interviews" : "/employer/interviews");
        return InterviewDto.from(interview);
    }

    @Transactional
    public InterviewDto complete(User user, Long interviewId) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> ApiException.notFound("Interview not found"));
        if (!interview.getEmployer().getId().equals(user.getId())) {
            throw ApiException.forbidden("Only the employer can mark an interview complete");
        }
        interview.setStatus(InterviewStatus.COMPLETED);
        interviewRepository.save(interview);
        notificationService.notify(interview.getWorker(), "Interview completed",
                "Your interview with " + interview.getEmployer().getName() + " was completed",
                NotificationType.INTERVIEW, "/worker/interviews");
        return InterviewDto.from(interview);
    }

    public List<InterviewDto> interviewsForEmployer(User employer) {
        return interviewRepository.findByEmployerOrderByScheduledAtDesc(employer).stream()
                .map(InterviewDto::from).toList();
    }

    public List<InterviewDto> interviewsForWorker(User worker) {
        return interviewRepository.findByWorkerOrderByScheduledAtDesc(worker).stream()
                .map(InterviewDto::from).toList();
    }
}
