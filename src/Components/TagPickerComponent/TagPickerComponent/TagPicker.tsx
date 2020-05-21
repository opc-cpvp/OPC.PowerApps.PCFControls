import * as React from 'react';

import { TagPicker, ITag } from 'office-ui-fabric-react/lib/Pickers';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';

initializeIcons();

export interface ITagPickerProps {
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