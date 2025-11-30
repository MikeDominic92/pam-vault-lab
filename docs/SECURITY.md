# Security Best Practices for PAM-Vault-Lab

**IMPORTANT:** This lab is designed for learning in a safe, isolated environment. Do NOT use these configurations in production.

## Lab vs Production

### This Lab Environment

- **Purpose:** Learning and practice
- **Security:** Intentionally relaxed for ease of use
- **Data:** No real credentials or sensitive data
- **Network:** Isolated local environment
- **Vault Mode:** Development (auto-unseals, in-memory)

### Production Environment

- **Purpose:** Protect real credentials
- **Security:** Hardened with multiple layers
- **Data:** Real production secrets
- **Network:** Isolated with strict firewall rules
- **Vault Mode:** Production (sealed, persistent storage)

## What's NOT Secure in This Lab

### 1. Development Mode Vault

**Lab Configuration:**
```bash
vault server -dev
```

**Issues:**
- Stores data in memory (lost on restart)
- Auto-unseals (no manual unseal required)
- Single unseal key
- No TLS/HTTPS
- Root token in environment variable

**Production Fix:**
```bash
vault server -config=/vault/config/vault.hcl
# Use 5 unseal keys with threshold of 3
# Enable TLS
# Never store root token
# Use auto-unseal with cloud KMS
```

### 2. Weak Passwords

**Lab:**
```
POSTGRES_PASSWORD=vaultpass123
MYSQL_ROOT_PASSWORD=rootpass123
SSH_TARGET_PASSWORD=changeme123
```

**Production:**
- Use 32+ character random passwords
- Rotate regularly (automated)
- Store in Vault (not env vars)
- Never commit to git

### 3. No TLS/SSL

**Lab:**
```
http://localhost:8200  # Unencrypted
```

**Production:**
```
https://vault.company.com:8200  # TLS 1.3
```

Requirements:
- Valid SSL certificate
- Strong ciphers only
- Certificate pinning
- HSTS headers

### 4. Default Credentials

**Lab:**
- Default admin/admin for Grafana
- Known passwords in .env
- No password complexity requirements

**Production:**
- Change all default credentials immediately
- Enforce password complexity
- Use MFA where possible
- Rotate credentials regularly

### 5. Permissive Network Access

**Lab:**
```yaml
# All ports exposed to host
ports:
  - "8200:8200"  # Vault
  - "5432:5432"  # PostgreSQL
  - "3306:3306"  # MySQL
```

**Production:**
- Use internal network only
- Bastion host for admin access
- VPN required
- Firewall rules (least privilege)

## Production Hardening Checklist

### Infrastructure

- [ ] Use production Vault configuration (not -dev)
- [ ] Enable TLS with valid certificates
- [ ] Use external, encrypted storage backend (Consul, etcd, cloud)
- [ ] Implement high availability (multi-node cluster)
- [ ] Enable auto-unseal with cloud KMS
- [ ] Separate Vault from databases on different hosts
- [ ] Use private networks (no public IPs)
- [ ] Implement network segmentation

### Access Control

- [ ] Never use root token (seal it after initial setup)
- [ ] Implement least privilege policies
- [ ] Enable MFA for human users
- [ ] Use short-lived tokens
- [ ] Enable AppRole for applications
- [ ] Implement approval workflows for sensitive operations
- [ ] Audit all access attempts

### Secrets Management

- [ ] Encrypt secrets at rest
- [ ] Encrypt secrets in transit
- [ ] Implement secret versioning
- [ ] Set appropriate TTLs
- [ ] Enable automatic rotation
- [ ] Use dynamic secrets where possible
- [ ] Never log secrets

### Monitoring & Auditing

- [ ] Enable all audit devices (file + syslog)
- [ ] Send audit logs to SIEM
- [ ] Monitor for anomalies
- [ ] Alert on suspicious activity
- [ ] Regular audit log reviews
- [ ] Implement log retention policy
- [ ] Protect audit logs from tampering

### Operational Security

- [ ] Regular security updates
- [ ] Patch management process
- [ ] Backup and recovery tested
- [ ] Disaster recovery plan
- [ ] Incident response plan
- [ ] Regular penetration testing
- [ ] Security awareness training

## Vault Production Configuration Example

```hcl
# vault-production.hcl

storage "consul" {
  address = "consul.internal:8500"
  path    = "vault/"
  tls_cert_file = "/vault/tls/consul-cert.pem"
  tls_key_file  = "/vault/tls/consul-key.pem"
  tls_ca_file   = "/vault/tls/ca.pem"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/tls/vault-cert.pem"
  tls_key_file  = "/vault/tls/vault-key.pem"
  tls_min_version = "tls13"
}

seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal-key"
}

api_addr = "https://vault.company.com:8200"
cluster_addr = "https://vault-node1.internal:8201"
ui = true

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = false
}

log_level = "info"
max_lease_ttl = "720h"
default_lease_ttl = "24h"
```

## Database Security

### PostgreSQL Hardening

```sql
-- Disable superuser for Vault
ALTER ROLE vaultadmin NOSUPERUSER;

-- Restrict connections
ALTER ROLE vaultadmin CONNECTION LIMIT 10;

-- Set password expiration
ALTER ROLE vaultadmin VALID UNTIL 'infinity';

-- Enable SSL
ALTER SYSTEM SET ssl = on;

-- Restrict pg_hba.conf
hostssl all vaultadmin 10.0.0.0/8 cert
```

### MySQL Hardening

```sql
-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disable remote root
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1');

-- Enforce SSL
ALTER USER 'vaultadmin'@'%' REQUIRE SSL;

-- Set password expiration
ALTER USER 'vaultadmin'@'%' PASSWORD EXPIRE INTERVAL 90 DAY;

FLUSH PRIVILEGES;
```

## Secrets Safety Rules

### DO

1. **Use Vault for all secrets**
   - Application passwords
   - API keys
   - Certificates
   - SSH keys

2. **Rotate regularly**
   - Database passwords: Daily to weekly
   - API keys: Monthly
   - Certificates: Before expiration
   - Root credentials: Quarterly

3. **Implement least privilege**
   - One role per application
   - Minimum required permissions
   - Short TTLs for high-privilege access

4. **Monitor everything**
   - All secret access
   - Failed authentication
   - Policy changes
   - Unusual patterns

### DO NOT

1. **Never commit secrets to git**
   - Use .gitignore
   - Scan commits for secrets
   - Use pre-commit hooks

2. **Never share secrets**
   - No email
   - No Slack/Teams
   - No screenshots
   - Use Vault paths instead

3. **Never use weak passwords**
   - Minimum 32 characters
   - Random generation
   - No dictionary words

4. **Never disable audit logging**
   - Required for compliance
   - Critical for forensics
   - Legal requirement in many industries

## Compliance Considerations

### PCI-DSS

- Requirement 8: Identify and authenticate access
- Requirement 10: Track and monitor all access
- Requirement 3: Protect stored data

### HIPAA

- Access controls (164.312(a))
- Audit controls (164.312(b))
- Encryption (164.312(a)(2)(iv))

### SOC 2

- Security (CC6.1, CC6.6, CC6.7)
- Availability (A1.2)
- Confidentiality (C1.1, C1.2)

### GDPR

- Article 32: Security of processing
- Article 25: Data protection by design

## Incident Response

### If Vault is Compromised

1. **Immediately:**
   - Seal Vault
   - Disconnect from network
   - Alert security team

2. **Investigation:**
   - Review audit logs
   - Identify affected secrets
   - Determine scope of breach

3. **Remediation:**
   - Rotate all secrets
   - Revoke compromised tokens
   - Patch vulnerabilities
   - Review and update policies

4. **Recovery:**
   - Unseal Vault after remediation
   - Restore from clean backup if needed
   - Monitor closely for anomalies

### If Credentials are Leaked

1. **Revoke immediately**
   ```bash
   vault lease revoke -prefix <path>
   ```

2. **Rotate related secrets**
   ```bash
   vault write -f database/rotate-root/<database>
   ```

3. **Investigate how leak occurred**

4. **Update processes to prevent recurrence**

## Security Testing

### Regular Tasks

- **Weekly:** Review audit logs
- **Monthly:** Access review (remove unused permissions)
- **Quarterly:** Penetration testing
- **Annually:** Full security audit

### Automated Testing

```bash
# Check for weak passwords
vault audit grep "password.*123"

# Find overly permissive policies
vault policy list | xargs -I {} vault policy read {}

# Identify long-lived tokens
vault list auth/token/accessors | xargs -I {} vault token lookup -accessor {}
```

## Learning Resources

- [Vault Production Hardening](https://learn.hashicorp.com/tutorials/vault/production-hardening)
- [CyberArk Security Best Practices](https://docs.cyberark.com/Product-Doc/OnlineHelp/PAS/Latest/en/Content/PAS%20SysReq/System%20Requirements%20-%20General.htm)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Remember:** This lab is for learning. Production requires proper security. When in doubt, consult security professionals.
