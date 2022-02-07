/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import ISelectionIdBuilder = powerbi.visuals.ISelectionIdBuilder;
import ISelectionId = powerbi.visuals.ISelectionId;

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private settings: VisualSettings;
    private textNode: Text;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private rowLevels: powerbi.DataViewHierarchyLevel[];
    private counter: number[];

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.target = options.element;
        this.updateCount = 0;
        if (document) {
            const new_p: HTMLElement = document.createElement("p");
            new_p.appendChild(document.createTextNode("Update count:"));
            const new_em: HTMLElement = document.createElement("em");
            this.textNode = document.createTextNode(this.updateCount.toString());
            
            new_em.appendChild(this.textNode);
            new_p.appendChild(new_em);
            this.target.appendChild(new_p);
        }
        
    }

    public update(options: VisualUpdateOptions) {
        this.counter = [0,0,0,0];
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        this.EMPTY_ELEMENT(this.target);
        console.log(options.dataViews[0].matrix,'data', options.dataViews[0].matrix.rows.root.children[0]);
        this.rowLevels = options.dataViews[0].matrix.rows.levels;
        options.dataViews[0].matrix.rows.root.children.forEach(child => {
            this.buildNode(child, []);
        })
        
        // let nodeSelectionBuilder: ISelectionIdBuilder = this.host.createSelectionIdBuilder();
        // nodeSelectionBuilder = nodeSelectionBuilder.withMatrixNode(options.dataViews[0].matrix.rows.root, options.dataViews[0].matrix.rows.levels);
        // // console.log(nodeSelectionBuilder);
        // this.nodeSelectionId = nodeSelectionBuilder.createSelectionId();
        console.log(this.counter);
        // if (this.textNode) {
        //     this.textNode.textContent = (this.updateCount++).toString();
        // }
    }

    private EMPTY_ELEMENT(element: HTMLElement) {
        while (element.hasChildNodes()) {
            element.removeChild(element.lastChild);
        }
    }

    private buildNode (node: powerbi.DataViewMatrixNode, parents: powerbi.DataViewMatrixNode[]) {
        if (!node.isSubtotal) {
            this.counter[node.level] += 1;
            let nodeSelectionBuilder: ISelectionIdBuilder = this.host.createSelectionIdBuilder();
            parents.push(node);
            for (let i = 0; i < parents.length; i++) {
                nodeSelectionBuilder = nodeSelectionBuilder.withMatrixNode(parents[i], this.rowLevels);
            }
            const nodeSelectionId = nodeSelectionBuilder.createSelectionId();
            const x = document.createElement("BUTTON");
            const t = document.createTextNode(<string>node.value);
            x.appendChild(t);
            x.addEventListener("click", () => {
                this.selectionManager.toggleExpandCollapse(nodeSelectionId);
                console.log(nodeSelectionId,'clicked', node.value);
            });
            this.target.appendChild(x);
            if (node.children) node.children.forEach(child => this.buildNode(child, [node]));
        }
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}


/* 
country(100), state(1000), city (10000)

no collapse
100, 0, 0
100, 1000, 0
10, 100, 1000

with collapse
100, 0, 0
1, 10, 0
1, 1, 10

Inference - Same Window only


,
    "expandCollapse": {
        "roles": ["cats"],
        "addDataViewFlags": {
            "defaultValue": true
        }
    },
    "drilldown": {
        "roles": ["cats"]
    }
*/