"use strict";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
    let subcmd = new SubCMD();
    context.subscriptions.push(new SubCMDController(subcmd));
}

class SubCMDController {
    private subcmd: SubCMD;
    private disposable: vscode.Disposable;

    constructor(subcmd: SubCMD){
        this.subcmd = subcmd;

        let subscriptions: vscode.Disposable[] = [];
        subscriptions.push(vscode.commands.registerCommand(
            "subcmd.viewCommands", () => {
                this.subcmd.viewCommands();
            }
        ));

        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    dispose(){
        this.disposable.dispose();
    }
}

interface ActionItem extends vscode.MessageItem {
    identifier: string;
}

class SubCMD {
    private splitOne(
        text: string, delimiter: string
    ): [string | undefined, string] {
        let components = text.split(delimiter);

        if (components.length > 1) {
            return [components[0], components.slice(1).join(delimiter)];
        } else {
            return [undefined, components[0]];
        }
    }

    private convertCaseSet(
        text: string, upperset: string[], lowerset: string[]
    ) {
        let words = text.split(" ");
        let length = words.length;
        return words.map((word, index) => (
            index === 0 || index === length - 1 ?
            word : (
                lowerset.indexOf(word.toLowerCase()) < 0 ? (
                    upperset.indexOf(word.toLowerCase()) < 0 ?
                    word : word.toUpperCase()
                ) : word.toLowerCase()
            )
        )).join(" ");
    }

    private convertPreposition(text: string) {
        return this.convertCaseSet(text, [
            "api", "asp", "aws", "cpu", "css", "db", "dos", "dbms", "ftp",
            "gif", "html", "http", "id", "ie", "ip", "ide", "js", "jdk",
            "jpg", "jre", "jvm", "jpeg", "json", "os", "pdf", "php", "png",
            "repl", "ssh", "scp", "svg", "svn", "sftp", "uri", "url"
        ], [
            "a", "an", "at", "as", "at", "after", "before", "but", "by",
            "from", "for", "in", "into", "of", "on", "out", "over", "the",
            "to", "with", "without"
        ]);
    }

    private convertToTitle(text: string) {
        return text.trim().replace(
            /^_+|_+$/g,
            ""
        ).replace(
            /([a-z0-9])([A-Z])/g,
            (all, first, second) => `${ first } ${ second }`
        ).replace(
            /([^\d])(\d+)$/g,
            (all, first, second) => `${ first } ${ second }`
        ).replace(
            /^(\w)|-+(\w)|(-+$)/g,
            (
                all, first, char, last
            ) => (
                last ? "" : (
                    first ? first.toUpperCase() : " " + char.toUpperCase()
                )
            )
        );
    }

    private convertToItem(command: string) {
        let [tag, rest] = this.splitOne(command, ":");

        let commandName;
        [commandName, rest] = this.splitOne(rest, ".");

        let joiner = (sections: string[]) => sections.filter(
            (section) => !!/\w/g.exec(section)
        ).map(
            (section) => this.convertPreposition(this.convertToTitle(section))
        );

        let spaceJoiner = (text: string) => joiner(
            this.convertToTitle(text).split(" ")
        ).join(" ");

        rest = joiner(rest.split(".")).join(" - ");

        return {
            label: `${
                tag ? `[${ spaceJoiner(tag) }] ` : ""
            }${
                commandName ? `${ spaceJoiner(commandName) }: ` : ""
            }${ rest }`,
            description: command
        };
    }

    viewCommands(filter?: string){
        vscode.commands.getCommands(false).then((commands) => {
            vscode.window.showQuickPick(
                commands.filter((command) => (
                    !filter || !!(new RegExp(filter, "g").exec(command))
                )).map((cmd) => this.convertToItem(cmd)).sort(
                    (a, b) => a.label.localeCompare(b.label)
                ), {
                    placeHolder: "filter"
                }
            ).then((item) => {
                if (!item) {
                    return;
                }

                vscode.window.showInformationMessage(item.description);
            });
        })
    }
}
