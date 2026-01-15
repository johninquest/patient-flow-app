# 🧹 Server/VPS Cleanup Guide

Quick reference for maintaining a healthy server. Run health checks weekly and cleanup when disk usage exceeds 70-75%.

---

## 📊 Health Check Commands

### Memory & Disk Overview
```bash
free -h && echo "---" && df -h
```

### Top 10 Memory-Consuming Processes
```bash
ps aux --sort=-%mem | head -10
```

### Docker Usage Summary
```bash
docker system df
```

### One-Liner Full Health Check
```bash
echo "=== MEMORY ===" && free -h && echo -e "\n=== DISK ===" && df -h && echo -e "\n=== DOCKER ===" && docker system df
```

---

## 🗑️ Safe Cleanup Commands

> **When to run:** Monthly, or when disk usage exceeds 75%

### 1. Clean Systemd Logs
Keeps only the last 500MB of logs:
```bash
sudo journalctl --vacuum-size=500M
```

### 2. Clean Docker Build Cache
Removes all unused build cache:
```bash
docker builder prune -a
```

### 3. Remove Stopped Containers & Unused Networks
```bash
docker system prune
```

### 4. Verify Cleanup Results
```bash
df -h
```

---

## 📅 Maintenance Schedule

| Task | Frequency | Trigger |
|------|-----------|---------|
| Health Check | Weekly | - |
| Safe Cleanup | Monthly | Disk > 70-75% |

---

## ⚠️ Notes

- Always check `df -h` before and after cleanup to verify space was freed
- The `docker system prune` command will ask for confirmation before removing data
- Add `-f` flag to skip confirmation prompts (use with caution)