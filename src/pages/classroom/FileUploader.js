import React, { useEffect, useRef } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import './css/FileUploader.css';

const FileUploader = ({ files = []}) => {
    const ws = useRef(null);

    return (

        <div className="file-uploader">
            <DocViewer
                documents={files.map((file) => ({
                    uri: file.uri,
                    fileName: file.name,
                }))}
                pluginRenderers={DocViewerRenderers}
            />
        </div>
    );
};

export default FileUploader;
