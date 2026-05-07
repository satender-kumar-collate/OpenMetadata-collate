/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { CSMode } from '../../../enums/codemirror.enum';
import CodeEditor from './CodeEditor';

const mockOnChange = jest.fn();
const mockOnFocus = jest.fn();
const mockOnCopyToClipBoard = jest.fn();
const mockRequestRefresh = jest.fn();

jest.mock('../../../constants/constants', () => ({
  JSON_TAB_SIZE: 2,
}));

jest.mock('../../../utils/SchemaEditor.utils', () => ({
  getSchemaEditorValue: jest.fn().mockImplementation((value) => value || ''),
}));

jest.mock('../../../hooks/useClipBoard', () => ({
  useClipboard: jest.fn().mockImplementation(() => ({
    onCopyToClipBoard: mockOnCopyToClipBoard,
    hasCopied: false,
  })),
}));

// Capture the callbacks the hook receives so tests can simulate user input/focus
let capturedOnChange: ((value: string) => void) | undefined;
let capturedOnFocus: (() => void) | undefined;
let capturedOpts: Record<string, unknown> = {};

jest.mock('../../../hooks/useCodeMirror', () => ({
  useCodeMirror: jest.fn().mockImplementation((opts: Record<string, unknown>) => {
    capturedOnChange = opts.onChange as ((value: string) => void) | undefined;
    capturedOnFocus = opts.onFocus as (() => void) | undefined;
    capturedOpts = opts;

    return {
      editorRef: { current: null },
      viewRef: {
        current: {
          scrollDOM: { scrollTo: jest.fn() },
          requestMeasure: jest.fn(),
          state: { doc: { toString: () => opts.value ?? '' } },
          dispatch: jest.fn(),
        },
      },
      requestRefresh: mockRequestRefresh,
    };
  }),
}));

const defaultProps = {
  value: 'test code',
  onChange: mockOnChange,
  onFocus: mockOnFocus,
};

describe('CodeEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOpts = {};
  });

  it('should render component with default props', () => {
    render(<CodeEditor />);

    expect(screen.getByTestId('code-mirror-container')).toBeInTheDocument();
    expect(screen.getByTestId('code-mirror-editor')).toBeInTheDocument();
    expect(screen.getByTestId('copy-button-container')).toBeInTheDocument();
    expect(screen.getByTestId('query-copy-button')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    const title = 'Custom Editor Title';
    render(<CodeEditor title={title} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-editor-class';
    render(<CodeEditor className={customClass} />);

    const container = screen.getByTestId('code-mirror-container');

    expect(container).toHaveClass(customClass);
    expect(container).toHaveClass('code-editor-new-style');
  });

  it('should apply custom editorClass to editor div', () => {
    const editorClass = 'custom-editor-class';
    render(<CodeEditor editorClass={editorClass} />);

    expect(screen.getByTestId('code-mirror-editor')).toHaveClass(editorClass);
  });

  it('should hide copy button when showCopyButton is false', () => {
    render(<CodeEditor showCopyButton={false} />);

    expect(
      screen.queryByTestId('copy-button-container')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('query-copy-button')).not.toBeInTheDocument();
  });

  it('should call onCopyToClipBoard when copy button is clicked', () => {
    render(<CodeEditor {...defaultProps} />);

    const copyButton = screen.getByTestId('query-copy-button');
    fireEvent.click(copyButton);

    expect(mockOnCopyToClipBoard).toHaveBeenCalledTimes(1);
  });

  it('should call onChange when editor value changes', () => {
    render(<CodeEditor {...defaultProps} />);

    act(() => {
      capturedOnChange?.('new code');
    });

    expect(mockOnChange).toHaveBeenCalledWith('new code');
  });

  it('should call onFocus when editor is focused', () => {
    render(<CodeEditor {...defaultProps} />);

    act(() => {
      capturedOnFocus?.();
    });

    expect(mockOnFocus).toHaveBeenCalledTimes(1);
  });

  it('should not call onChange when onChange prop is not provided', () => {
    render(<CodeEditor value="test" />);

    act(() => {
      capturedOnChange?.('new code');
    });

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should pass custom mode to useCodeMirror', () => {
    const customMode = { name: CSMode.SQL, json: false };
    render(<CodeEditor mode={customMode} />);

    expect(capturedOpts.mode).toEqual(customMode);
  });

  it('should merge custom options with defaults', () => {
    const customOptions = {
      lineNumbers: true,
      readOnly: true,
    };
    render(<CodeEditor options={customOptions} />);

    expect(capturedOpts.showLineNumbers).toBe(true);
    expect(capturedOpts.readOnly).toBe(true);
    expect(capturedOpts.tabSize).toBe(2);
  });

  describe('readOnly prop', () => {
    it('should pass readOnly=true when top-level readOnly prop is set', () => {
      render(<CodeEditor readOnly />);

      expect(capturedOpts.readOnly).toBe(true);
    });

    it('should fall back to options.readOnly when top-level readOnly is not provided', () => {
      render(<CodeEditor options={{ readOnly: true }} />);

      expect(capturedOpts.readOnly).toBe(true);
    });

    it('should prefer top-level readOnly over conflicting options.readOnly', () => {
      render(<CodeEditor readOnly options={{ readOnly: false }} />);

      expect(capturedOpts.readOnly).toBe(true);
    });
  });

  it('should refresh editor when refreshEditor prop is true', () => {
    jest.useFakeTimers();

    const { rerender } = render(<CodeEditor refreshEditor={false} />);

    rerender(<CodeEditor refreshEditor />);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(mockRequestRefresh).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('should not refresh editor when refreshEditor prop is false', () => {
    jest.useFakeTimers();

    render(<CodeEditor refreshEditor={false} />);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(mockRequestRefresh).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should use default JavaScript JSON mode', () => {
    render(<CodeEditor />);

    expect(capturedOpts.mode).toEqual({
      name: CSMode.JAVASCRIPT,
      json: true,
    });
  });

  it('should handle component lifecycle without errors', () => {
    const { unmount } = render(<CodeEditor />);

    expect(() => unmount()).not.toThrow();
  });

  it('should render without onFocus when not provided', () => {
    render(<CodeEditor value="test" onChange={mockOnChange} />);

    expect(screen.getByTestId('code-mirror-editor')).toBeInTheDocument();
  });
});
