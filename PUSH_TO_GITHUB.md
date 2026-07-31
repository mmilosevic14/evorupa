# Push to GitHub

This repository currently uses `main` as the default branch and HTTPS remote:

```powershell
git remote -v
# origin  https://github.com/mmilosevic14/evorupa.git (fetch)
# origin  https://github.com/mmilosevic14/evorupa.git (push)
```

## Standard Push Flow

```powershell
git status --short
git add <files>
git commit -m "Your commit message"
git push origin main
```

## GitHub CLI Setup For This Machine

System MSI install of GitHub CLI is blocked by local policy on this workstation, so a portable copy was installed under the current user profile:

```powershell
$env:LOCALAPPDATA\Programs\GitHubCLI\gh.exe
```

Authenticate with:

```powershell
& "$env:LOCALAPPDATA\Programs\GitHubCLI\gh.exe" auth login
& "$env:LOCALAPPDATA\Programs\GitHubCLI\gh.exe" auth status
```

The current GitHub account for this repo is expected to be:

```text
mmilosevic14
```

## Saved Git Credential Settings

Global Git is configured to let GitHub CLI provide GitHub HTTPS credentials:

```powershell
git config --global credential.https://github.com.helper ""
git config --global credential.https://github.com.helper "!'C:\Users\mmilosev\AppData\Local\Programs\GitHubCLI\gh.exe' auth git-credential"
git config --global credential.https://gist.github.com.helper ""
git config --global credential.https://gist.github.com.helper "!'C:\Users\mmilosev\AppData\Local\Programs\GitHubCLI\gh.exe' auth git-credential"
```

This repository also has a repo-local helper entry for Git for Windows shell execution:

```powershell
git config --local credential.helper ""
git config --local credential.helper "!/c/Users/mmilosev/AppData/Local/Programs/GitHubCLI/gh.exe auth git-credential"
```

## If Push Still Fails With HTTP 403

On this network, `git push origin main` can still fail even after successful `gh auth login` because outbound GitHub write traffic is being blocked or rewritten by local network security tooling.

Checks that already succeeded locally:

```powershell
& "$env:LOCALAPPDATA\Programs\GitHubCLI\gh.exe" auth status
& "$env:LOCALAPPDATA\Programs\GitHubCLI\gh.exe" api repos/mmilosevic14/evorupa --jq ".permissions.push"
```

If those pass but `git push origin main` still returns `HTTP 403`, use one of these recovery paths:

1. Push from a shell or machine that is not behind the current proxy/security filter.
2. Switch the repo to SSH and push with a GitHub SSH key.
3. Re-run authentication, then retry `git push origin main` from your own terminal session.

## Current Verified Fix

The account-page navigation fix was committed locally as:

```text
52ee730 Fix account report edit card navigation
```

If you need to re-apply just that change onto another branch state:

```powershell
git cherry-pick 52ee730
```
