
export interface Message {
    by: string; // user, assistant, tool..
    type: string; // text, widget...
    content: string; // text, widget name...
    toolDetails?: {
        runID: string;
        toolCallID: string;
        arguments: string;
        output?: string;
    }
}

