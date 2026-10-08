package com.skillbridge.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(Map.of("error", HttpStatus.valueOf(ex.getStatus()).getReasonPhrase(),
                        "message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Validation Failed", "fieldErrors", errors));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Forbidden", "message", "You do not have permission to perform this action"));
    }

    /**
     * A body the server could not read is the caller's mistake, not ours.
     *
     * Jackson throws this for an unknown enum value or a malformed field, and
     * it was falling through to the catch-all below as a 500 "Internal Server
     * Error" - which tells an app nothing and makes a typo look like an
     * outage. The apps show the message, so it has to name the field.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        // Logged as well as returned. The first version of this swallowed the
        // cause entirely, so a rejected request left nothing behind to debug -
        // the phone said "we could not read one of the values" and the server
        // said nothing at all.
        log.warn("Unreadable request body: {}", ex.getMostSpecificCause().toString());

        String field = fieldOf(ex.getCause());
        String detail;
        if (ex.getCause() instanceof InvalidFormatException ife) {
            detail = "\"" + ife.getValue() + "\" is not a valid value"
                    + (field == null ? "." : " for " + field + ".");
        } else if (field != null) {
            detail = "We could not read the value sent for " + field + ".";
        } else {
            detail = "We could not read one of the values sent.";
        }
        return ResponseEntity.badRequest()
                .body(Map.of("error", "Bad Request", "message", detail));
    }

    /** The last name in Jackson's path, which is the field that actually failed. */
    private static String fieldOf(Throwable cause) {
        if (cause instanceof JsonMappingException jme && !jme.getPath().isEmpty()) {
            var ref = jme.getPath().get(jme.getPath().size() - 1);
            if (ref.getFieldName() != null) return ref.getFieldName();
        }
        return null;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal Server Error", "message", ex.getMessage()));
    }
}
