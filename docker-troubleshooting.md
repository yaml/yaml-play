# Docker Troubleshooting Session

## Machine 1: Storage Corruption Issues

### Initial Problem
```
$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
17eec7bbc9d7: Extracting
docker: failed to register layer: mkdir /var/lib/docker/overlay2/...: bad message
```

### Diagnosis
- Error: "bad message" when trying to register Docker layers
- Indicates Docker overlay2 storage backend corruption
- Storage: `/dev/vdb` mounted at `/var/lib/docker` (192GB, 9% used)
- Docker daemon was running but had storage issues

### Solution Steps

1. **Cleaned Docker storage:**
```bash
docker system prune -a -f
```

2. **Still seeing errors after cleanup:**
```
docker: sync /var/lib/docker/image/overlay2/.tmp-repositories.json: structure needs cleaning
```

3. **Restarted Docker daemon (fixed the issue):**
```bash
sudo systemctl restart docker
```

4. **Image corruption after initial fix:**
```
exec /hello: exec format error
```

5. **Attempted to remove corrupted image:**
```bash
docker rm <container-id>
docker rmi hello-world
docker run hello-world
```

6. **Persistent filesystem corruption returned:**
```
docker: failed to write digest data: sync /var/lib/docker/image/overlay2/imagedb/content/sha256/...: structure needs cleaning
```

### Recommended Fix (not completed on this machine)
```bash
# Stop Docker
sudo systemctl stop docker

# Unmount the filesystem
sudo umount /var/lib/docker

# Check and repair the filesystem
sudo fsck -y /dev/vdb

# Remount it
sudo mount /dev/vdb /var/lib/docker

# Start Docker
sudo systemctl start docker
```

---

## Machine 2 (blacktop): Mounted Partition Corruption

### Initial Problem
```
$ sudo systemctl start docker
Job for docker.service failed because the control process exited with error code.
```

### Error Logs
```
Dec 16 17:49:41 blacktop dockerd[349227]: failed to start daemon: readdirnames /var/lib/docker/runtimes: readdirent runtimes: bad message
```

### Diagnosis
- Docker daemon couldn't start due to corrupted `/var/lib/docker/runtimes` directory
- Same "bad message" filesystem corruption error
- Discovery: `/var/lib/docker` was on a separate mounted partition `/dev/nvme0n1p6`
- User preference: wanted `/var/lib/docker` to be a normal directory, not a mounted partition

### Mount Configuration
```bash
$ mount | grep docker
/dev/nvme0n1p6 on /var/lib/docker type ext4 (rw,relatime)
```

### Attempted Removal (failed due to corruption)
```bash
$ sudo rm -r /var/lib/docker/runtimes
rm: cannot remove '/var/lib/docker/runtimes': Structure needs cleaning
```

### Solution

1. **Unmounted the corrupted partition:**
```bash
sudo umount /var/lib/docker
```

2. **After unmounting, the underlying directory was accessible:**
```bash
$ sudo ls -l /var/lib/docker
total 60
drwx--x--x   5 root root  4096 Nov 28 09:35 buildkit
drwx--x---   3 root root  4096 Dec  8 16:33 containers
-rw-------   1 root root    36 Nov 28 08:20 engine-id
drwx------   3 root root  4096 Nov 28 08:20 image
drwxr-x---   3 root root  4096 Nov 28 08:20 network
drwx--x--- 150 root root 20480 Dec  8 16:33 overlay2
drwx------   3 root root  4096 Nov 28 08:20 plugins
drwx------   2 root root  4096 Nov 28 08:20 runtimes
drwx------   2 root root  4096 Nov 28 08:20 swarm
drwx------   2 root root  4096 Dec  8 10:21 tmp
drwx-----x   2 root root  4096 Nov 28 08:20 volumes
```

3. **Started Docker successfully using the regular directory:**
```bash
sudo systemctl start docker
```

### Follow-up Recommendations

**Prevent the partition from auto-mounting on reboot:**
```bash
# Check for mount configuration
grep nvme0n1p6 /etc/fstab

# If found, remove or comment out the line
sudo sed -i.bak '/nvme0n1p6/d' /etc/fstab
```

**Optional: Repair the corrupted partition for data recovery:**
```bash
# Run fsck on the unmounted partition
sudo fsck -y /dev/nvme0n1p6

# Mount it temporarily to check/copy data
sudo mkdir -p /mnt/docker-old
sudo mount /dev/nvme0n1p6 /mnt/docker-old
ls -la /mnt/docker-old

# Copy anything needed, then unmount
sudo umount /mnt/docker-old
```

---

## Common Patterns and Lessons

### "bad message" and "structure needs cleaning" errors
- These are ext4 filesystem corruption errors
- Can be caused by:
  - Improper shutdowns
  - Disk hardware issues
  - I/O errors
  - Full disk conditions

### Resolution strategies
1. **Restart Docker daemon** - sometimes clears temporary issues
2. **Clean Docker storage** - `docker system prune -a -f`
3. **Filesystem repair** - `fsck -y /dev/<device>` (requires unmounting)
4. **Unmount and use underlying directory** - if separate partition isn't needed

### Prevention
- Monitor disk health
- Ensure proper system shutdowns
- Keep adequate free space
- Consider regular `docker system prune` maintenance
