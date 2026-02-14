import type { GeneratedFile } from './entity-generator.js';

/**
 * Spring Boot 설정 클래스를 생성합니다.
 * - SwaggerConfig (OpenAPI 3.0 문서화)
 * - WebConfig (CORS)
 * - GlobalExceptionHandler
 * - ErrorResponse DTO
 * - ResourceNotFoundException
 */
export class JavaConfigGenerator {
    constructor(private readonly basePackage: string) { }

    generateSwaggerConfig(title: string, version: string): GeneratedFile {
        return {
            fileName: 'SwaggerConfig.java',
            path: 'config/SwaggerConfig.java',
            content: `package ${this.basePackage}.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("${title}")
                        .version("${version}")
                        .description("Auto-generated API documentation"));
    }
}
`,
        };
    }

    generateWebConfig(): GeneratedFile {
        return {
            fileName: 'WebConfig.java',
            path: 'config/WebConfig.java',
            content: `package ${this.basePackage}.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
`,
        };
    }

    generateExceptionHandler(): GeneratedFile {
        return {
            fileName: 'GlobalExceptionHandler.java',
            path: 'exception/GlobalExceptionHandler.java',
            content: `package ${this.basePackage}.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Failed")
                .message(message)
                .build();
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message(ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
`,
        };
    }

    generateErrorResponse(): GeneratedFile {
        return {
            fileName: 'ErrorResponse.java',
            path: 'exception/ErrorResponse.java',
            content: `package ${this.basePackage}.exception;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
}
`,
        };
    }

    generateResourceNotFoundException(): GeneratedFile {
        return {
            fileName: 'ResourceNotFoundException.java',
            path: 'exception/ResourceNotFoundException.java',
            content: `package ${this.basePackage}.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
`,
        };
    }
}
