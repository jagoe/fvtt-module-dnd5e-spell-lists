import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import process from "process";
import prompts from "prompts";
import foundryConfig from "../foundryconfig.json" with { type: "json" };

if (!foundryConfig.dataPath) {
    console.error("Please provide a valid dataPath in foundryconfig.json.");
    process.exit(1);
}

const fvttVersion = (
    await prompts({
        type: "select",
        name: "value",
        message: "Select the FoundryVTT version you want to use.",
        choices: Object.keys(foundryConfig.fvtt).map((version) => ({
            title: version,
            value: version,
        })),
    })
).value as number;

const fvttPath =
    foundryConfig.fvtt[
        fvttVersion.toString() as keyof typeof foundryConfig.fvtt
    ];

if (!fvttPath) {
    console.error(`FoundryVTT version "${fvttVersion}" not found.`);
    process.exit(1);
}

const windowsExecPath = path.resolve(fvttPath, "Foundry Virtual Tabletop.exe");
const nodeEntryPoint =
    fvttVersion < 13
        ? path.resolve(fvttPath, "resources", "app", "main.js")
        : path.resolve(fvttPath, "main.js");
const macApp = fvttPath;

const startFoundry = async () => {
    try {
        if (fs.existsSync(windowsExecPath)) {
            console.log(`Starting FoundryVTT from ${windowsExecPath}...`);
            console.log(
                "Make sure to close FoundryVTT instead of using Ctrl-C to stop it.",
            );

            const quotedPath = `"${windowsExecPath}"`;
            await spawn(quotedPath);
        } else if (fs.existsSync(nodeEntryPoint)) {
            console.log(`Starting FoundryVTT from ${nodeEntryPoint}...`);

            await spawn(
                `node`,
                [nodeEntryPoint, `--dataPath=${foundryConfig.dataPath}`],
                { stdio: "inherit" },
            );
        } else if (macApp.endsWith(".app")) {
            console.log(`Starting ${macApp}...`);
            await spawn("open", [
                `-a "${macApp}"`,
                `--env=FOUNDRY_VTT_DATA_PATH="${foundryConfig.dataPath.substring(0, foundryConfig.dataPath.length - 5)}"`,
            ]);
        } else {
            console.error(
                `Cannot start FoundryVTT. "${fvttPath}" is not a valid Foundry path.`,
            );
            process.exit(1);
        }
    } catch (error) {
        console.error(error);
    }
};

startFoundry().catch(console.error);
