-- Initialize multiple databases for different services
-- Use IF NOT EXISTS to avoid errors if database already exists
CREATE DATABASE admin;
CREATE DATABASE mov_auth;
CREATE DATABASE mov_events;
CREATE DATABASE mov_enrollments;

-- Connect to mov_auth database
\c mov_auth;

-- Create initial schema will be handled by Sequelize migrations

-- Connect to mov_events database
\c mov_events;

-- Create initial schema will be handled by Sequelize migrations

-- Connect to mov_enrollments database
\c mov_enrollments;

-- Create initial schema will be handled by Sequelize migrations
