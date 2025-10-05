# Bedrock Dedicated Server Addon Manager

## Overview

Managing addons for a Minecraft Bedrock Dedicated Server (BDS) can be a manual and error-prone process. This tool provides a graphical user interface (GUI) to simplify the discovery, installation, and synchronization of addons for your local dedicated server worlds.

The goal is to create a centralized dashboard to manage the complex relationships between server configurations, world files, and addon packages.

## Core Features

-   **Addon Discovery:**
    -   Automatically scan and list available addons from the Minecraft Marketplace `premium_cache` folder.
    -   Support for adding and managing addons from other custom sources.

-   **World Analysis:**
    -   Read the behavior and resource pack manifests for each world associated with the dedicated server.
    -   Verify which required addon files are present or missing for each world.

-   **Synchronization:**
    -   Display a clear status of which addons are correctly installed versus which are missing or mismatched.
    -   Synchronize the required addon files into a world's behavior and resource pack directories, ensuring the world loads correctly with all its declared dependencies.

## Roadmap (Future Features)

-   **Third-Party Integration:**
    -   Query popular addon sites like CurseForge and MCPEDL for available addons.
    -   Provide functionality to download and install addons directly from these sources.

-   **Update Management:**
    -   Implement an update-check feature to compare locally installed third-party addons against the latest versions available on CurseForge and MCPEDL.

-   **Compatibility Testing:**
    -   Develop a framework to run automated compatibility tests when new addons are introduced or existing ones are updated.