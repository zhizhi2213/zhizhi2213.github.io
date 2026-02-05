---
title: '''Trae-Java环境配置'''
date: 2026-01-26 19:01:35
tags:
---


## 配置Java环境
### 1. 安装Java环境配置包 `Java Extension Pack` ,`Spring Boot Extension Pack`

### 2. 配置Java环境 settings.json文件
```json
{
  "java.import.gradle.java.home": "C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot"
}
 
```


### 3.配置maven环境 settings.json文件
```json
{
  "java.configuration.maven.globalSettings": "C:\\work\\apache-maven-3.9.12\\conf\\all.xml",
  "maven.executable.path": "C:\\work\\apache-maven-3.9.12\\bin\\mvn.cmd"
}
 
```
### 4.配置单元测试环境（可选） 配置vm参数（Java 9+ 引入了模块系统，默认不允许通过反射访问模块内部，所以需要明确开放这些包给未命名模块使用）
```json
{
  "java.test.config": {
    "vmArgs": [
      "--add-opens=java.base/java.lang=ALL-UNNAMED",
      "--add-opens=java.base/java.math=ALL-UNNAMED",
      "--add-opens=java.base/java.lang.invoke=ALL-UNNAMED",
      "--add-opens=java.base/java.net=ALL-UNNAMED",
      "--add-opens=java.base/java.util=ALL-UNNAMED",
      "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED",
      "--add-opens=java.base/java.io=ALL-UNNAMED",
      "--add-opens=java.base/java.time=ALL-UNNAMED",
      "--add-opens=java.base/java.security=ALL-UNNAMED",
      "--add-opens=java.base/sun.security.util=ALL-UNNAMED",
      "--illegal-access=permit"
    ]
  } 
}

```
### 5.配置运行环境（可选） 配置vm参数（Java 9+ 引入了模块系统，默认不允许通过反射访问模块内部，所以需要明确开放这些包给未命名模块使用）
launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Current File",
      "request": "launch",
      "mainClass": "${file}",
      "vmArgs" :"--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.math=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED"
    },
    {
      "type": "java",
      "name": "BankSteelPurchaseFinanceApp",
      "request": "launch",
      "mainClass": "com.banksteel.purchase.BankSteelPurchaseFinanceApp",
      "projectName": "banksteel-purchase-finance",
      "vmArgs" :"--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.math=ALL-UNNAMED --add-opens java.base/java.lang.invoke=ALL-UNNAMED"
    }
  ]
}
```


ps:
cursor 配置文件 settings.json
```json
{
  "workbench.colorTheme": "Default Light Modern",
  "java.import.gradle.java.home": "C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot",
  "java.jdt.ls.java.home": "",
  "maven.executable.options": "",
  "java.configuration.maven.globalSettings": "",
  "maven.executable.path": "C:\\work\\apache-maven-3.6.3\\bin\\mvn.cmd",
  "maven.excludedFolders": [

    "**/.*",
    "**/node_modules",
    "**/target",
    "**/bin",
    "**/archetype-resources"
  ],
  "redhat.telemetry.enabled": true,
  "java.configuration.maven.userSettings": "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <settings xmlns=\"http://maven.apache.org/SETTINGS/1.0.0\"           xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"           xsi:schemaLocation=\"http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd\">      <localRepository>C:\\repository</localRepository>     <pluginGroups></pluginGroups>     <proxies></proxies>   <mirrors>     <mirror>       <id>banksteel-mirror</id>       <name>Banksteel Maven Public Mirror</name>       <url>http://nexus.registry.banksteel.com/repository/banksteel/</url>       <mirrorOf>central</mirrorOf>       <blocked>false</blocked>     </mirror>   </mirrors>     <profiles>      <profile>       <id>dev</id>       <repositories>              <repository>           <id>dev.snapshot</id>           <url>http://nexus.registry.banksteel.com/repository/dev-snapshots/</url>           <releases>               <enabled>false</enabled>           </releases>           <snapshots>               <enabled>true</enabled>               <updatePolicy>always</updatePolicy>           </snapshots>         </repository>       </repositories>     </profile> \t \t <profile>       <id>test</id>       <repositories>         <repository>           <id>test.snapshot</id>           <url>http://nexus.registry.banksteel.com/repository/test-snapshots/</url>           <releases>               <enabled>false</enabled>           </releases>           <snapshots>               <enabled>true</enabled>               <updatePolicy>always</updatePolicy>           </snapshots>         </repository>       </repositories>     </profile> \t \t \t <profile>       <id>pre</id>       <repositories>          <repository>           <id>pre.snapshot</id>           <url>http://nexus.registry.banksteel.com/repository/pre-snapshots/</url>           <releases>               <enabled>false</enabled>           </releases>           <snapshots>               <enabled>true</enabled>               <updatePolicy>always</updatePolicy>           </snapshots>         </repository>        </repositories>     </profile> \t \t <profile>       <id>prod</id>       <repositories>         <!-- 生产仓库 -->         <repository>           <id>prod.snapshot</id>           <url>http://nexus.registry.banksteel.com/repository/snapshots/</url>           <releases>             <enabled>false</enabled>           </releases>           <snapshots>             <enabled>true</enabled>             <updatePolicy>always</updatePolicy>           </snapshots>         </repository>        </repositories>     </profile>   </profiles>    <activeProfiles>     <activeProfile>dev</activeProfile>   </activeProfiles> </settings>",
  "maven.terminal.useJavaHome": true,
  "java.project.outputPath": "",
  "maven.settingsFile": "C:\\work\\apache-maven-3.6.3\\conf\\all.xml",
  "security.workspace.trust.untrustedFiles": "open",
  "java.test.config": {
    "vmArgs": [
      "--add-opens=java.base/java.lang=ALL-UNNAMED",
      "--add-opens=java.base/java.math=ALL-UNNAMED",
      "--add-opens=java.base/java.lang.invoke=ALL-UNNAMED",
      "--add-opens=java.base/java.net=ALL-UNNAMED",
      "--add-opens=java.base/java.util=ALL-UNNAMED",
      "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED",
      "--add-opens=java.base/java.io=ALL-UNNAMED",
      "--add-opens=java.base/java.time=ALL-UNNAMED",
      "--add-opens=java.base/java.security=ALL-UNNAMED",
      "--add-opens=java.base/sun.security.util=ALL-UNNAMED",
      "--illegal-access=permit"
    ]
  }
}
```
### 可能遇到的问题

1. 拉取私库时因为maven版本过高，私库不支持https,需要设置maven配置文件
   blocked 设置 false
```xml
    <mirror>
       ...
      <blocked>false</blocked>
    </mirror>
```
以上无法解决，建议本地仓库地址使用配置默认的也就是.m2下的仓库地址