export class Logger {
    static truncateLong: boolean = true;
    static truncateLength: number = 100;

    processName: string;

    constructor(processName: string) {
        this.processName = processName;
    }

    subprocess(subprocessName: string): Logger {
        return new Logger(this.processName + " > " + subprocessName);
    }

    log(message: any) {
        console.log("\n" + this.processName + ": " + message);
    }

    logSubprocess(subprocessName: string, message: any) {
        console.log("\n" + this.processName + " > " + subprocessName + ": " + message);
    }

    logFunctionCall(functionName: string, values: any[]) {
        var message = this.processName + " > " + functionName + ": called!"
        for (let i=0; i<values.length; i++) {
            const value = values[i];
            message += "\n-----" + i + "-- " + this.truncate(value);
        }
        console.log("\n" + message);
    }

    logCall(values: any[]) {
        var message = this.processName + ": called!"
        for (let i=0; i<values.length; i++) {
            let value = values[i];
            if (typeof value === "object") {
                value = JSON.stringify(value);
            }
            message += "\n-----" + i + "-- " + this.truncate(value);
        }
        console.log("\n" + message);
    }

    logFunctionReturn(functionName: string, returnValue: any) {
        let value = returnValue;
        if (typeof value === "object") {
            value = JSON.stringify(value);
        }
        console.log("\n" + this.processName + " > " + functionName + ": returned!\n-----value-- " + this.truncate(value));
    }

    logReturn(returnValue: any) {
        console.log("\n" + this.processName + ": returned!\n-----value-- " + this.truncate(returnValue));
    }

    truncate(value: any): string {
        const stringValue = String(value);
        if (Logger.truncateLong && stringValue.length > Logger.truncateLength) {
            return stringValue.substring(0, Logger.truncateLength) + "...";
        } else {
            return stringValue;
        }
    }
}