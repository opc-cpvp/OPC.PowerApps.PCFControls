# OPC PowerApps PCF Controls

[![Build Status](https://dev.azure.com/opc-cpvp/O365%20Cloud/_apis/build/status/PowerApps/OPC.PowerApps.PCFControls%20-%20CI?branchName=master)](https://dev.azure.com/opc-cpvp/O365%20Cloud/_build/latest?definitionId=51&branchName=master)

[![Total alerts](https://img.shields.io/lgtm/alerts/g/opc-cpvp/OPC.PowerApps.PCFControls.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/opc-cpvp/OPC.PowerApps.PCFControls/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/opc-cpvp/OPC.PowerApps.PCFControls.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/opc-cpvp/OPC.PowerApps.PCFControls/context:javascript)

Collection of PowerApps PCF Controls.

Controls:
- [Tag Picker Component](#tag-picker-component)
- [Tag Picker Grid Component](#tag-picker-grid-component)

Plugins:
- TagRegistrationPlugin

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Follow the instructions as per the [documentation](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/create-custom-controls-using-pcf) in order to configure your environment for PCF development.

### Building a Component

Navigate to the root folder of the component you wish to build and run the following commands:

```
npm run build
```

Note: You must run `npm install` before building the component for the first time.

### Running a Component

Navigate to the root folder of the component you wish to build and run the following commands:

```
npm run start
```

Note: You must run `npm install` before running the component for the first time.

### Building the Plugin

Open the solution `OPC.PowerApps.PCFControls.sln` from Visual Studio 2019 and build the projects.

### Building the Solution

Run the following command from the `Solution` folder in order to build the solution:

```
msbuild /t:clean;build /p:Configuration=Release /restore
```

## Tag Picker Component

[![dependencies Status](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls/status.svg?path=src/Components/TagPickerComponent)](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls?path=src/Components/TagPickerComponent) [![devDependencies Status](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls/dev-status.svg?path=src/Components/TagPickerComponent)](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls?path=src/Components/TagPickerComponent&type=dev)

### Preview

![TagPickerComponent Preview](https://github.com/opc-cpvp/OPC.PowerApps.PCFControls/blob/master/img/tagpickercomponent.gif?raw=true)

### Purpose

The purpose of this control is to allow user to associate / disassociate records for a many-to-many relationship in the form of tags. This also works when creating an entity for the first time.

### Configuration

|Parameter|Description|Required|Bound to an attribute|
|---------|-----------|:----:|:---:|
|**Tag Data**|Stores the temporary values required for the creation of the related entities|X|X|
|**Related Entity**|Logical name of the related entity|X||
|**Relationship Name**|Relationship name between the primary entity and the related entity|X||
|**Relationship Entity**|Logical name of the relationship entity|X||

## Tag Picker Grid Component

[![dependencies Status](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls/status.svg?path=src/Components/TagPickerGridComponent)](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls?path=src/Components/TagPickerGridComponent) [![devDependencies Status](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls/dev-status.svg?path=src/Components/TagPickerGridComponent)](https://david-dm.org/opc-cpvp/OPC.PowerApps.PCFControls?path=src/Components/TagPickerGridComponent&type=dev)

### Preview

![TagPickerGridComponent Preview](https://github.com/opc-cpvp/OPC.PowerApps.PCFControls/blob/master/img/tagpickergridcomponent.gif?raw=true)

The purpose of this control is to allow user to associate / disassociate records for a many-to-many relationship in the form of tags.

### Configuration

|Parameter|Description|Required|Bound to an attribute|
|---------|-----------|:----:|:---:|
|**Related Entity**|Logical name of the related entity|X||
|**Relationship Name**|Relationship name between the primary entity and the related entity|X||
|**Relationship Entity**|Logical name of the relationship entity|X||
|**Label Text**|Field label that will be displayed on the form. It currently accepts the following formats: Label or en=Label\|fr=Étiquette|X||

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

See also the list of [contributors](https://github.com/opc-cpvp/OPC.PowerApps.PCFControls/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
