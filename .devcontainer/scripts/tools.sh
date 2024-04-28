#!/bin/bash

mkdir -p ~/.ssh && \
  touch ~/.ssh/known_hosts && \
  sudo tee ~/.ssh/config > /dev/null << EOF 
Host github.com
  HostName github.com
  PreferredAuthentications publickey
  IdentityFile ~/.hostssh/id_rsa.pub
EOF

sudo chown -R vscode:vscode ~/.ssh