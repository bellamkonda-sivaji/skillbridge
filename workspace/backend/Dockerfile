# Build the jar inside the image so a deploy needs nothing but Docker on the
# box - no JDK, no Maven, no matching local toolchain.
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Dependencies first: this layer is cached and only reruns when pom.xml
# changes, so an ordinary code change does not re-download the world.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q clean package -DskipTests

# A JRE, not a JDK: nothing at runtime needs a compiler.
FROM eclipse-temurin:17-jre
WORKDIR /app

# Runs unprivileged. A container that never needs to write outside /tmp has
# no business being root.
RUN useradd --system --uid 10001 jobon
COPY --from=builder /build/target/skillbridge-backend-1.0.0.jar app.jar
USER jobon

EXPOSE 8080

# Container memory, not the host's: without this the JVM sizes its heap from
# the whole machine and gets killed by the cgroup limit under load.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
