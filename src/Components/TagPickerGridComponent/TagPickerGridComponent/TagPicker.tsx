import * as React from 'react';

import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { TagPicker, ITag } from 'office-ui-fabric-react/lib/Pickers';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

initializeIcons();

export interface ITagPickerProps {
  labelText?: string,
  tagDisplayName?: string,
  selectedItems?: ITag[],
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
      tagDisplayName: props.tagDisplayName || "Tags",
      selectedItems: props.selectedItems || []
    };
  }

  public componentWillReceiveProps(newProps: ITagPickerState): void {
    this.setState(newProps);
  }

  public render(): JSX.Element {
    const { tagDisplayName, selectedItems } = this.state;

    return (
      <div className={"tagPickerComponent"}>
        <Stack horizontal tokens={{
          childrenGap: 10
        }}>
          <Icon iconName="" styles={{ root: { width: 14, height: 14 } }} />
          <Stack.Item grow>
            <Stack horizontal wrap>
              <Label styles={{ root: { width: 150 } }}>{this.props.labelText}</Label>
              <Stack.Item grow>
                <TagPicker
                  removeButtonAriaLabel="Remove"
                  selectedItems={selectedItems}
                  onChange={this._onChange}
                  onItemSelected={this._onItemSelected}
                  onResolveSuggestions={this._onResolveSuggestions}
                  onEmptyInputFocus={this._onEmptyInputFocus}
                  getTextFromItem={this._getTextFromItem}
                  pickerSuggestionsProps={{
                    noResultsFoundText: `No ${tagDisplayName} Found`
                  }}
                  resolveDelay={300}
                  inputProps={{
                    'aria-label': `${tagDisplayName} Picker`
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
    this.setState(
      (prevState: ITagPickerState): ITagPickerState => {
        prevState.selectedItems = items;
        return prevState;
      }
    );

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