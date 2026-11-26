resource "azurerm_container_app" "backend" {
  name                         = "ca-brilliant-backend-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.backend.id
  resource_group_name          = azurerm_resource_group.backend.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = data.azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  secret {
    name                = "database-url"
    identity            = azurerm_user_assigned_identity.apps.id
    key_vault_secret_id = "${azurerm_key_vault.backend.vault_uri}secrets/database-url"
  }

  secret {
    name                = "jwt-secret"
    identity            = azurerm_user_assigned_identity.apps.id
    key_vault_secret_id = "${azurerm_key_vault.backend.vault_uri}secrets/jwt-secret"
  }

  secret {
    name                = "postgres-password"
    identity            = azurerm_user_assigned_identity.apps.id
    key_vault_secret_id = "${azurerm_key_vault.backend.vault_uri}secrets/postgres-password"
  }

  template {
    container {
      name   = "backend"
      image  = "${data.azurerm_container_registry.main.login_server}/${var.backend_image}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      env {
        name  = "FRONTEND_URL"
        value = var.frontend_origin
      }
    }

    min_replicas = 1
    max_replicas = 1

    # Keep the existing backend container block here, unchanged.

    container {
      name   = "db"
      image  = "docker.io/library/postgres:17-alpine"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "POSTGRES_USER"
        value = "dev"
      }

      env {
        name  = "POSTGRES_DB"
        value = "app_dev"
      }

      env {
        name        = "POSTGRES_PASSWORD"
        secret_name = "postgres-password"
      }
    }
  }

  ingress {
    external_enabled = false
    target_port      = 3000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

resource "azurerm_container_app" "frontend" {
  name                         = "ca-brilliant-frontend-${var.environment}"
  container_app_environment_id = azurerm_container_app_environment.backend.id
  resource_group_name          = azurerm_resource_group.backend.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.apps.id]
  }

  registry {
    server   = data.azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.apps.id
  }

  secret {
    name                = "cookie-secret"
    identity            = azurerm_user_assigned_identity.apps.id
    key_vault_secret_id = "${azurerm_key_vault.backend.vault_uri}secrets/cookie-secret"
  }

  template {
    container {
      name   = "frontend"
      image  = "${data.azurerm_container_registry.main.login_server}/${var.frontend_image}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name        = "COOKIE_SECRET"
        secret_name = "cookie-secret"
      }

      env {
        name  = "API_BASE_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }

      env {
        name  = "CUSTOMER_ACCOUNT_SERVICE_URL"
        value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

output "frontend_url" {
  description = "Public URL of the frontend Container App."
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}
