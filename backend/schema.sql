-- schema.sql — Base de datos para arq-apps
-- Ejecutar: mysql -u root < schema.sql

CREATE DATABASE IF NOT EXISTS arq_apps
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE arq_apps;

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Proyectos
CREATE TABLE IF NOT EXISTS projects (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(120) NOT NULL DEFAULT 'Nueva matriz',
  type       VARCHAR(50)  NOT NULL DEFAULT 'matrix',
  data       JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ejes de la matriz (filas y columnas)
CREATE TABLE IF NOT EXISTS matrix_axes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  axis_type   ENUM('row','col') NOT NULL,
  zone        VARCHAR(255) NOT NULL,
  component   VARCHAR(255) NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Posiciones del diagrama de ponderaciones (ángulo de cada burbuja dentro de su sector)
CREATE TABLE IF NOT EXISTS diagram_positions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  project_id   INT NOT NULL,
  axis_id      INT NOT NULL,
  angle_offset FLOAT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_proj_axis (project_id, axis_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (axis_id)    REFERENCES matrix_axes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Celdas de la matriz
CREATE TABLE IF NOT EXISTS matrix_cells (
  project_id  INT NOT NULL,
  row_axis_id INT NOT NULL,
  col_axis_id INT NOT NULL,
  value       INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, row_axis_id, col_axis_id),
  FOREIGN KEY (project_id)  REFERENCES projects(id)     ON DELETE CASCADE,
  FOREIGN KEY (row_axis_id) REFERENCES matrix_axes(id)   ON DELETE CASCADE,
  FOREIGN KEY (col_axis_id) REFERENCES matrix_axes(id)   ON DELETE CASCADE
) ENGINE=InnoDB;
