# DBC Network Explorer

DBC Network Explorer is a lightweight, browser-based engineering tool that turns an automotive CAN database file (`.dbc`) into an interactive network map of ECUs, messages, and signals.

Instead of manually digging through raw text DBC files, you can upload a DBC and instantly visualize:
- Which **ECUs/Nodes** exist in the network.
- Which ECUs transmit which **messages**.
- A detailed breakdown of **Signals** and where they are routed (receivers).
- The logical communication connections between ECUs.

## One-Click Universal Launch (Recommended)

To guarantee the application runs flawlessly on **any device** (Windows, Linux, macOS) without needing to worry about Python versions, Node installations, or system paths, we use **Docker**.

### Prerequisites
- **Docker Desktop** (or Docker Engine + Docker Compose)

### How to Run via Docker
1. Open your terminal in this repository's root folder.
2. Run the Docker Compose command:
   ```bash
   docker compose up --build
   ```
3. That's it! Docker will automatically pull the necessary environments, install the side-packages, and spin up both the frontend and backend.
4. Open your browser to **http://localhost:5173**.

To stop the app, just press `Ctrl+C`.

---

## Alternative: Native Bash Script (Mac/Linux)

If you prefer not to use Docker and are on macOS or Linux, you can use the native bash script.
Requires Node.js (v20+) and Python 3 (v3.9+).

1. Open your terminal.
2. Run the launch script:
   ```bash
   ./run.sh
   ```
3. Open your browser to **http://localhost:5173**.

## Architecture
- **Backend (Python & FastAPI):** Uses the industry-standard `cantools` library to parse the DBC files. It filters out missing definitions, resolves implied nodes, correctly maps signals to their respective transmitters and receivers, and handles complex CAN structures like extended frames and multiplexing safely.
- **Frontend (React & Vite):** Uses Tailwind CSS for styling and `@xyflow/react` (React Flow) for rendering the interactive logical topology graph. Provides detailed Node and Edge inspectors to drill down into the message sizes, CAN IDs, cycle times, and signal bit lengths.

## Testing with DBCs
The `audi.dbc` example file in the repository root is from commaai's open-source `opendbc` project and is included for demo testing.

If you want to test the capabilities of this tool with more DBC files, you can explore public DBC repositories like commaai's `opendbc`:
```bash
git clone https://github.com/commaai/opendbc.git
```
You can drag and drop any DBC file from that repository into the app!
