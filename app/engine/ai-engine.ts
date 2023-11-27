import { OpenAI } from "openai";
import { Chat, ChatCompletion } from "openai/resources/chat/index.mjs";
import { ReadStream } from "fs";
import { Thread } from "openai/resources/beta/threads/threads.mjs";
import { MessageContentText, ThreadMessage } from "openai/resources/beta/threads/messages/messages.mjs";
import { Run } from "openai/resources/beta/threads/runs/runs.mjs";
import { Logger } from "./logging-engine";
import { Message } from "../model/message";
import { ToolCallsStepDetails } from "openai/resources/beta/threads/runs/steps.mjs";

export class OpenAIEngine {
    logger: Logger = new Logger("OpenAIEngine");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY!, dangerouslyAllowBrowser: false});
    generalAssistantId: string = "asst_50XPjQkI94nTIPQo539HO54T";
    model = "gpt-3.5-turbo";
    transcriptionModel = "whisper-1";
    checkIntervalMs = 1000;

    async generateFrom(text: string, options?: {threadID?: string, runID?: string, file?: ReadStream }): Promise<{ messages?: Message[], threadID: string, runID: string}> {
        const lg = this.logger.subprocess("generateFrom");
        lg.logCall([text, options]);

        //Idk if this helps

        const response = await this.assistantRequest(text, options);

        lg.logReturn(response);
        return response;
    }

    async deleteThread(threadId: string) {
        const lg = this.logger.subprocess("deleteThread");
        lg.logCall([threadId]);

        const response = await this.openai.beta.threads.del(threadId);

        lg.log(response);
    }

    async transcribe(file: ReadStream): Promise<string> {
        const lg = this.logger.subprocess("transcribe");
        lg.logCall([file]);

        var transcription = "";

        try {
            const response = await this.openai.audio.transcriptions.create({
              file: file,
              model: this.transcriptionModel,
            });
            transcription = response.text;
        } catch (error) {
            console.log('ERROR IS:', error)
        }

        lg.logReturn(transcription);
        return transcription;
    }

    async getLastMessage(threadId: string): Promise<Message | undefined> {
        const lg = this.logger.subprocess("getLastMessage");
        lg.logCall([threadId]);

        const messages = await this.openai.beta.threads.messages.list(
            threadId
        );

        if (messages.data.length == 0) {
            return undefined;
        }

        const lastMessage = messages.data[0];
        lg.log("Last message: " + JSON.stringify(lastMessage));

        var text = "";

        //We go through the array because the last message can be composed of multiple elements (text, images, etc.)
        for (let contentElement of lastMessage.content) { 
            lg.log(JSON.stringify(contentElement));
            if (contentElement.type == "text") {
                const textElement = contentElement as MessageContentText;
                text += textElement.text.value;
            }
        }

        lg.logReturn(text);
        return {by: lastMessage.role, type: "text", content: text};
    }

    async getMessages(threadId: string): Promise<Message[]> {
        const lg = this.logger.subprocess("getMessages");
        lg.logCall([threadId]);

        const messages = await this.openai.beta.threads.messages.list(
            threadId
        );

        let sMessages: Message[] = [];

        for (let message of messages.data) {
            let messageText = "";
            console.log("Currently processing message: " + JSON.stringify(message));
            for (let messageContent of message.content) {
                if (messageContent.type == "text") {
                    const textElement = messageContent as MessageContentText;
                    messageText += textElement.text.value;
                }
            }

            sMessages.push({by: message.role, type: "text", content: messageText});

            if (message.role == "assistant") {
                if (message.run_id != null && message.run_id != undefined) {
                    const runStepsObj = await this.openai.beta.threads.runs.steps.list(
                        threadId,
                        message.run_id!
                    );
                    console.log("Retreived run steps object: " + JSON.stringify(runStepsObj));

                    const runSteps = runStepsObj.data.reverse();
                    console.log("Run steps: " + JSON.stringify(runSteps));

                    let toolMessages: Message[] = [];
                    for (let runStep of runSteps) {
                        console.log("Currently examining run step: " + JSON.stringify(runStep));
                        if (runStep.type == "tool_calls") {
                            console.log("Step is a tool call!");
                            const toolStepDetails = runStep.step_details as ToolCallsStepDetails;
                            for (let toolCall of toolStepDetails.tool_calls) {
                                console.log("Currently examining tool call: " + JSON.stringify(toolCall));
                                if (toolCall.type == "function") {
                                    console.log("Tool call is a function! Adding to messages");
                                    toolMessages.push({by: "tool", type: "widget", content: toolCall.function.name, toolDetails: {runID: message.run_id, toolCallID: "unavailable", arguments: toolCall.function.arguments, output: toolCall.function.output ?? undefined}});
                                }
                            }
                        }
                    }

                    toolMessages.reverse();
                    sMessages = sMessages.concat(toolMessages);

                }
            }
        }

        const reversed = sMessages.reverse();
        lg.logReturn(reversed);
        return reversed;
    }

    private async assistantRequest(text: string, options?: {threadID?: string,  file?: ReadStream }): Promise<{ messages?: Message[], threadID: string, runID: string}> {
        const lg = this.logger.subprocess("assistantRequest");
        lg.logCall([text, options]);

        let thread;

        if (options?.threadID != null && options?.threadID != undefined) {
            thread = await this.openai.beta.threads.retrieve(options.threadID);
            lg.log("Thread retreived: " + thread.id);
        } else {
            thread = await this.openai.beta.threads.create();
            lg.log("Thread created: " + thread.id);
        }

        let fileId: string | undefined = undefined;
        if (options?.file != null && options?.file != undefined) {
            fileId = await this.uploadFile(options.file!);
        }

        await this.addMessage(text, thread.id);

        //Start run
        var run = await this.startRun(thread.id);
        lg.log("Started run " + thread.id);
        var response = await this.manageRun(run.id, thread.id);

        lg.logReturn(response);
        return {messages: response, threadID: thread.id, runID: run.id};
    }

    private async uploadFile(file: ReadStream): Promise<string> {
        const lg = this.logger.subprocess("uploadFile");
        lg.logCall([file]);

        const oaFile = await this.openai.files.create({
            file: file,
            purpose: "assistants",
        });

        lg.logReturn(oaFile.id);
        return oaFile.id;
    }

    private async manageRun(runId: string, threadId: string): Promise<Message[] | undefined> {
        const lg = this.logger.subprocess("manageRun");
        lg.logCall([runId, threadId]);

        var run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
        lg.log("Obtained a new run! Status: " + run.status);
        while (run.status == "in_progress" || run.status == "queued") {
            lg.log("Checking status...");
            await new Promise((resolve) => setTimeout(resolve, this.checkIntervalMs));
            run = await this.openai.beta.threads.runs.retrieve(threadId, run.id);
            lg.log("Status:" + run.status);
        }

        switch (run.status) {
            case "completed":
                const lastMessage = await this.getLastMessage(threadId);
                lg.logReturn(lastMessage);
                return [lastMessage ?? {by: "assistant", type: "text", content: "No response"}];
                break;
            case "failed":
                break;
            case "requires_action":
                const actionMessage = await this.statusRequiresAction(run);
                lg.logReturn(actionMessage);
                return actionMessage;
                break;
            case "cancelling":
                break;
            case "cancelled":
                break;
            case "expired":
                break;
            default:
                break;
        }

        return undefined;
    }

    

    private async statusRequiresAction(run: Run): Promise<Message[] | undefined> {
        const lg = this.logger.subprocess("statusRequiresAction");
        lg.logCall([run]);

        const toolCalls = run.required_action?.submit_tool_outputs.tool_calls

        if (toolCalls == null || toolCalls == undefined || toolCalls.length == 0) {
            return undefined;
        }
        const functionCallMessages = toolCalls.map((toolCall) => {
            return {
                by: "tool", 
                type: "widget", 
                content: toolCall.function.name,
                toolDetails: {
                    runID: run.id,
                    toolCallID: toolCall.id,
                    arguments: toolCall.function.arguments,
                }
            };
        });

        lg.logReturn(functionCallMessages);
        return functionCallMessages;

    }

    async toolResponse(data: {reply: string, toolData?: {runID: string, toolCallID: string}}[], threadID: string): Promise<{ messages?: Message[], threadID: string, runID: string}> {
        const run = await this.openai.beta.threads.runs.submitToolOutputs(
            threadID,
            data[0].toolData!.runID,
            {
              tool_outputs: [
                ...data.map((toolData) => {
                    return {
                        tool_call_id: toolData.toolData!.toolCallID,
                        output: toolData.reply,
                    }
                }) 
              ],
            }
        );

        const messages = await this.manageRun(run.id, threadID);
        return {messages: messages, threadID: threadID, runID: run.id};
    }

    private async statusCompleted(threadId: string): Promise<string> {
        const lg = this.logger.subprocess("statusCompleted");
        lg.logCall([threadId]);

        const messages = await this.openai.beta.threads.messages.list(
            threadId
        );

        const lastMessageContent = messages.data[0].content; // Last message is the first in the array
        lg.log("Messags data array: " + JSON.stringify(messages.data));

        var text = "";
        lg.log("Last message count items: " + lastMessageContent.length);

        //We go through the array because the last message can be composed of multiple elements (text, images, etc.)
        for (let i = 0; i < lastMessageContent.length; i++) { 
            const lastMessageContentElement = lastMessageContent[i];
            lg.log(lastMessageContentElement);
            if (lastMessageContentElement.type == "text") {
                const textElement = lastMessageContentElement as MessageContentText;
                text += textElement.text.value;
            }
        }

        lg.logReturn(text);
        return text;
    }

    private async startRun(threadId: string, assistantId?: string): Promise<Run> { //if no assistantId is provided, the general assistant is used
        const lg = this.logger.subprocess("startRun");
        lg.logCall([threadId, assistantId]);

        const run = await this.openai.beta.threads.runs.create(
            threadId,
            { 
              assistant_id: assistantId ?? this.generalAssistantId,
            }
        );

        lg.logReturn(run);
        return run;
    }

    private async addMessage(content: string, threadId: string, fileId?: string): Promise<ThreadMessage> {
        const lg = this.logger.subprocess("addMessage");
        lg.logCall([content, threadId, fileId]);

        let fileIds: string[] = [];
        if (fileId != null && fileId != undefined) {
            fileIds.push(fileId);
        }
        const message = await this.openai.beta.threads.messages.create(
            threadId,
            {
              role: "user",
              content: content,
              file_ids: fileIds,
            }
        );

        lg.logReturn(message);
        return message;
    }

    private async request(text: string, file?: ReadStream): Promise<ChatCompletion> {
        const lg = this.logger.subprocess("request");
        lg.logCall([text, file]);

        var content = text;

        lg.logReturn(content);
        return await this.openai.chat.completions.create({
            messages: [
              {
                role: "user",
                content: content,
              },
            ],
            model: this.model,
        });
    }  

}