import React, { useEffect, useRef, useCallback,useState } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import './css/FileUploader.css';
import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocumentProxy } from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const FileUploader = ({ files = []}) => {
    const ws = useRef(null);
    var BASE64_MARKER = ';base64,';
    const canvasRef = useRef(null);
    const [pdfBase64, setPdfBase64] = useState('');
    const [pdfImage, setPdfImage] = useState('');
    const pageNum = useRef(1);
    const maxPageNum = useRef(0);
    const pdf = useRef(null);

    const convertToBase64 = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file[0]);
        reader.onload = () => {
            setPdfBase64(reader.result);
            renderPdfToImage(reader.result);

        };
        reader.onerror = (error) => {
            console.error('Error converting file to base64:', error);
        };
    };

    const convertDataURIToBinary = (dataURI) => {
        var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
        var base64 = dataURI.substring(base64Index);
        var raw = window.atob(base64);
        var rawLength = raw.length;
        var array = new Uint8Array(new ArrayBuffer(rawLength));

        for(var i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }


    const renderPdfToImage = async (base64) => {
        const basedata = atob(base64.split(",")[1])
        const uint8Array = new Uint8Array(basedata.length);
        for (let i = 0; i < basedata.length; i++) {
            uint8Array[i] = basedata.charCodeAt(i);
        }
        const loadingTask = pdfjs.getDocument({data: uint8Array});
        pdf.current = await loadingTask.promise;

        renderOtherPage(1);
        maxPageNum.current = pdf.current.numPages
    };

    const renderOtherPage = async(pageNum) => {
        const page = await pdf.current.getPage(pageNum); //현재 페이지 렌더링

        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;

        const image = canvas.toDataURL();
        setPdfImage(image);
    }

    const nextPage = () => {
        const nextNum = pageNum.current + 1
        if(maxPageNum.current < nextNum){
            return
        }
        pageNum.current = nextNum
        renderOtherPage(pageNum.current)
    }

    const prevPage = () => {
        const prevNum = pageNum.current - 1
        if(1 > prevNum){
            return
        }
        pageNum.current = prevNum
        renderOtherPage(pageNum.current)
    }


    useEffect(() => {
        if(files.length == 0) return;
        convertToBase64(files);
    }, [files]);
    return (

        <div>
            <h2>PDF Image:</h2>
            <button onClick={nextPage}>next </button>
            <button onClick={prevPage}>prev </button>
            <img src={pdfImage} alt="PDF Page" />
        </div>
    );
};

export default FileUploader;
