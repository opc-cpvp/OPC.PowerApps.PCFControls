import * as React from 'react';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { TagPicker, ITag } from 'office-ui-fabric-react/lib/Pickers';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

initializeIcons();


export interface ITagPickerLabelProps {
    input?: string;
    noResultsFound?: string;
    removeButton?: string;
}

export interface ITagPickerProps {
    labels: ITagPickerLabelProps,
    labelText?: string;
    selectedItems?: ITag[];
    onChange?: (items?: ITag[]) => void;
    onEmptyInputFocus?: (selectedItems?: ITag[]) => Promise<ITag[]>;
    onResolveSuggestions?: (filter: string, selectedItems?: ITag[]) => Promise<ITag[]>;
}

export interface ITagPickerState extends React.ComponentState, ITagPickerProps {
}

export class TagPickerBase extends React.Component<ITagPickerProps, ITagPickerState> {
    constructor(props: ITagPickerProps) {
        super(props);

        this.state = {
            labels: props.labels,
            selectedItems: props.selectedItems || []
        };
    }

    public componentWillReceiveProps(newProps: ITagPickerState): void {
        this.setState(newProps);
    }

    public render(): JSX.Element {
        const { selectedItems } = this.state;

        return (
            <div className={"tagPickerGridComponent"}>
                <Stack horizontal>
                <Stack.Item align="center">
                    <Icon iconName="" />
                </Stack.Item>
                <Stack.Item grow>
                    <Stack horizontal wrap>
                    <Label>{this.props.labelText}</Label>
                    <Stack.Item grow>
                        <TagPicker
                            removeButtonAriaLabel={this.props.labels.removeButton}
                            selectedItems={selectedItems}
                            onChange={this._onChange}
                            onItemSelected={this._onItemSelected}
                            onResolveSuggestions={this._onResolveSuggestions}
                            onEmptyInputFocus={this._onEmptyInputFocus}
                            getTextFromItem={this._getTextFromItem}
                            pickerSuggestionsProps={{
                                noResultsFoundText: this.props.labels.noResultsFound
                            }}
                            resolveDelay={300}
                            inputProps={{
                                'aria-label': this.props.labels.input
                            }}
                        />
                    </Stack.Item>
                    </Stack>
                </Stack.Item>
                </Stack>
            </div>
        );
    }

    private _getTextFromItem(item: ITag): string {
        return item.name;
    }

    private _onChange = (items?: ITag[]): void => {
        this.setState((prevState: ITagPickerState): ITagPickerState => {
            prevState.selectedItems = items;
            return prevState;
        });

        if (this.props.onChange)
            this.props.onChange(items);
    }

    private _onItemSelected = (selectedItem?: ITag | undefined): ITag | null => {
        if (!selectedItem)
            return null

        const itemSelected = this.state.selectedItems!.filter(compareTag => compareTag.key === selectedItem.key).length > 0;
        return !itemSelected ? selectedItem : null;
    };

    private _onResolveSuggestions = (filter: string,  selectedItems?: ITag[] | undefined): Promise<ITag[]> => {
        if (this.props.onResolveSuggestions)
            return this.props.onResolveSuggestions(filter, selectedItems);

        return Promise.resolve([]);
    };

    private _onEmptyInputFocus = (selectedItems?: ITag[] | undefined): Promise<ITag[]> => {
        if (this.props.onEmptyInputFocus)
            return this.props.onEmptyInputFocus(selectedItems);

        return Promise.resolve([]);
    };
}