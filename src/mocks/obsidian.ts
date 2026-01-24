export class App {
    vault: any;
    metadataCache: any;
}

export class TAbstractFile {
    path: string = '';
    name: string = '';
    parent: TFolder | null = null;
}

export class TFile extends TAbstractFile {
    stat: any;
    basename: string = '';
    extension: string = '';
}

export class TFolder extends TAbstractFile {
    children: TAbstractFile[] = [];
}
