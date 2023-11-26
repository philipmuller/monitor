import { ReadStream } from "fs";
import { OpenAIEngine } from "./ai-engine";
import { Logger } from "./logging-engine";
import { create } from "domain";
import { FileEngine } from "./file-engine";


export abstract class LighthouseEngine {
    private static logger: Logger = new Logger("ServerEngine");

    private static aiEngine = new OpenAIEngine();
    
    static auth() {
        //Implement authentication
    }

    //Comms ------------------

    //File management ---------
    static async donwloadFile(url: string, filename: string): Promise<string> {
        const lg = this.logger.subprocess("donwloadFile");
        lg.logCall([url, filename]);

        const returnValue = await FileEngine.downloadFile(url, filename);
        lg.logReturn(returnValue);
        return returnValue;
    }

    static readFile(path: string): ReadStream {
        const lg = this.logger.subprocess("readFile");
        lg.logCall([path]);

        const returnValue = FileEngine.readFile(path);
        lg.logReturn(returnValue);
        return returnValue;
    }

    //AI features -------------
    static async getTranscription(file: ReadStream): Promise<string> {
        const lg = this.logger.subprocess("getTranscription");
        lg.logCall([file]);

        const returnValue = await this.aiEngine.transcribe(file);
        lg.logReturn(returnValue);
        return returnValue;
    }

    static async getResponseFromText(text: string): Promise<string> {
        const lg = this.logger.subprocess("getDeckFromText");
        lg.logCall([text]);

        const returnValue = await this.getResponse(text);
        lg.logReturn(returnValue);
        return returnValue;
    }

    static async getResponseFromFile(url: string, fileType: string): Promise<string> {
        const lg = this.logger.subprocess("getDeckFromFile");
        lg.logCall([url, fileType]);

        const path = await this.donwloadFile(url, "temp." + fileType);
        const file = await this.readFile(path);

        var returnValue = "";

        if (fileType == "mp3" || fileType == "wav" || fileType == "webm") {
            const transcription = await this.getTranscription(file);
            //Work needed to determine if normal audio or live audio
            returnValue = await this.getResponse(transcription);
        } else {
            returnValue = await this.getResponse("", file);
        }

        lg.logReturn(returnValue);
        return returnValue;
    }

    private static async getResponse(text: string, file?: ReadStream): Promise<string> {
        const lg = this.logger.subprocess("(private) getDeck");
        lg.logCall([text, file]);

        const response = await this.aiEngine.generateFrom(text, file);

        lg.logReturn(response);
        return response;
    }
}