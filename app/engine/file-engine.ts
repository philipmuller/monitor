import { ReadStream } from "fs";
import { Logger } from "./logging-engine";

export abstract class FileEngine {

    private static logger: Logger = new Logger("FileEngine");

    static storagePath: string = "/tmp/";

    static async downloadFile(url: string, filename: string): Promise<string> {
        const fs = require('fs');
        const { Readable } = require('stream');
        const { finished } = require('stream/promises');

        console.log(`Downloading file with params: url: ${url}, filename: ${filename}`);
        const res = await fetch(new URL(url), { method: 'GET' });
        const savePath = this.storagePath + filename;
        const fileStream = fs.createWriteStream(savePath);
        await finished(Readable.fromWeb(res.body).pipe(fileStream));
        console.log(`Finished saving file to ${savePath}`);
        return savePath;
    }

    static readFile(path: string): ReadStream {
        const fs = require('fs');
        return fs.createReadStream(path)
    }

}