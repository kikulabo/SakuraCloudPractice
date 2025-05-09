terraform {
  required_providers {
    sakuracloud = {
      source  = "sacloud/sakuracloud"
      version = "2.26.1"
    }
  }
}
provider "sakuracloud" {
  token = var.sakuracloud_access_token
  secret = var.sakuracloud_access_token_secret
  zone = "is1b"
}

# 環境変数から取得する変数を定義
variable "sakuracloud_access_token" {
  type = string
}

variable "sakuracloud_access_token_secret" {
  type = string
}

# 設定するパスワードの変数を定義
variable "password" {
  type = string
}

# ディスクにインストールするイメージを指定。他には"centos8stream"や"ubuntu"などが指定できます。
# 設定できるos_typeの詳細: https://docs.usacloud.jp/terraform/d/archive/
data "sakuracloud_archive" "ubuntu" {
  os_type = "ubuntu2204"
}

# 作成するディスクを定義
resource "sakuracloud_disk" "example1_disk" {
  name              = "example1_disk"
  size              = 20
  plan              = "ssd"
  connector         = "virtio"
  source_archive_id = data.sakuracloud_archive.ubuntu.id
}

# 作成するサーバを定義
resource "sakuracloud_server" "example1_srv" {
  name        = "example1_srv"
  disks       = [sakuracloud_disk.example1_disk.id]
  core        = 1
  memory      = 1
  description = "descriptionIshere"
  tags        = ["tag_tag", "tag_testme"]

  # サーバのNICの接続先の定義。sharedだと共有セグメント(インターネット)に接続される。
  network_interface {
    upstream = "shared"
  }
  disk_edit_parameter {
    hostname = "example"
    password = var.password
    disable_pw_auth = true
  }
}
