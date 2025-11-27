import { useState, useEffect, useCallback } from 'react';
import { PaneState, LayoutState, ColorScheme, EditorType } from '../lib/types';
import { parsers, getDefaultVisibleParsers } from '../lib/parsers';

const STORAGE_KEY = 'yaml-play-layout';

function getDefaultLayout(): LayoutState {
  const defaultVisible = getDefaultVisibleParsers();
  // Assign order based on position in defaultVisible array for visible panes
  // Hidden panes get high order numbers
  const panes: PaneState[] = parsers.map((parser) => {
    const visibleIndex = defaultVisible.indexOf(parser.id);
    return {
      id: parser.id,
      visible: visibleIndex >= 0,
      order: visibleIndex >= 0 ? visibleIndex : 1000 + parsers.findIndex(p => p.id === parser.id),
    };
  });
  // Set default visible panes as the selected set (for 'S' shortcut)
  return { panes, selectedPaneIds: defaultVisible };
}

export function useLayoutPersistence() {
  const [layout, setLayout] = useState<LayoutState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LayoutState;
        // Merge with current parsers in case new ones were added
        const existingIds = new Set(parsed.panes.map(p => p.id));
        const newPanes = parsers
          .filter(p => !existingIds.has(p.id))
          .map((p, i) => ({
            id: p.id,
            visible: false,
            order: parsed.panes.length + i,
          }));
        return {
          ...parsed,
          panes: [...parsed.panes, ...newPanes],
        };
      }
    } catch {
      // Ignore parse errors
    }
    return getDefaultLayout();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const updatePaneVisibility = useCallback((id: string, visible: boolean) => {
    setLayout(prev => {
      let newPanes: PaneState[];
      // If showing a pane, move it to the rightmost position
      if (visible) {
        const maxOrder = Math.max(...prev.panes.map(p => p.order));
        newPanes = prev.panes.map(p =>
          p.id === id ? { ...p, visible, order: maxOrder + 1 } : p
        );
      } else {
        newPanes = prev.panes.map(p =>
          p.id === id ? { ...p, visible } : p
        );
      }
      // Save visible panes as the user's selection (for 'S' shortcut)
      const selectedPaneIds = newPanes.filter(p => p.visible).map(p => p.id);
      return {
        ...prev,
        panes: newPanes,
        selectedPaneIds,
      };
    });
  }, []);

  const reorderPanes = useCallback((fromId: string, toId: string) => {
    setLayout(prev => {
      const panes = [...prev.panes];
      const fromIndex = panes.findIndex(p => p.id === fromId);
      const toIndex = panes.findIndex(p => p.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [removed] = panes.splice(fromIndex, 1);
      panes.splice(toIndex, 0, removed);

      // Update order numbers
      return {
        panes: panes.map((p, i) => ({ ...p, order: i })),
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLayout(getDefaultLayout());
  }, []);

  const showAllPanes = useCallback(() => {
    setLayout(prev => {
      // Get currently visible panes and their max order
      const visiblePanes = prev.panes.filter(p => p.visible);
      const maxOrder = visiblePanes.length > 0
        ? Math.max(...visiblePanes.map(p => p.order))
        : -1;

      // Get hidden panes sorted alphabetically by id
      const hiddenPanes = prev.panes
        .filter(p => !p.visible && p.id !== 'refparse')
        .sort((a, b) => a.id.localeCompare(b.id));

      // Create a map of new orders for hidden panes
      const newOrders = new Map<string, number>();
      hiddenPanes.forEach((p, i) => {
        newOrders.set(p.id, maxOrder + 1 + i);
      });

      return {
        ...prev,
        panes: prev.panes.map(p => ({
          ...p,
          visible: true,
          order: newOrders.has(p.id) ? newOrders.get(p.id)! : p.order,
        })),
      };
    });
  }, []);

  const hideAllPanes = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      panes: prev.panes.map(p =>
        p.id === 'refparse' ? p : { ...p, visible: false }
      ),
    }));
  }, []);

  const showSelectedPanes = useCallback(() => {
    setLayout(prev => {
      const selectedIds = new Set(prev.selectedPaneIds ?? []);
      // If no selection saved, do nothing
      if (selectedIds.size === 0) return prev;

      // Restore visibility based on selectedPaneIds
      return {
        ...prev,
        panes: prev.panes.map(p => ({
          ...p,
          visible: selectedIds.has(p.id),
        })),
      };
    });
  }, []);

  const showErrorPanes = useCallback((errorPaneIds: string[]) => {
    setLayout(prev => {
      const errorIds = new Set(errorPaneIds);
      // Find hidden panes that have errors
      const hiddenErrorPanes = prev.panes.filter(p => !p.visible && errorIds.has(p.id));
      if (hiddenErrorPanes.length === 0) return prev;

      // Get max order of currently visible panes
      const maxOrder = Math.max(...prev.panes.filter(p => p.visible).map(p => p.order), -1);

      // Make hidden error panes visible, placing them after current visible panes
      // Do NOT update selectedPaneIds - so 'S' still restores original selection
      let nextOrder = maxOrder + 1;
      return {
        ...prev,
        panes: prev.panes.map(p => {
          if (!p.visible && errorIds.has(p.id)) {
            return { ...p, visible: true, order: nextOrder++ };
          }
          return p;
        }),
      };
    });
  }, []);

  const setInputPaneWidth = useCallback((width: number) => {
    setLayout(prev => ({
      ...prev,
      inputPaneWidth: width,
    }));
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setLayout(prev => ({
      ...prev,
      colorScheme: scheme,
    }));
  }, []);

  const setEditorType = useCallback((type: EditorType) => {
    setLayout(prev => ({
      ...prev,
      editorType: type,
    }));
  }, []);

  const getVisiblePanes = useCallback(() => {
    return layout.panes
      .filter(p => p.visible)
      .sort((a, b) => a.order - b.order);
  }, [layout.panes]);

  return {
    layout,
    updatePaneVisibility,
    reorderPanes,
    resetLayout,
    showAllPanes,
    hideAllPanes,
    showSelectedPanes,
    showErrorPanes,
    getVisiblePanes,
    inputPaneWidth: layout.inputPaneWidth ?? 400,
    setInputPaneWidth,
    colorScheme: layout.colorScheme ?? 'dark',
    setColorScheme,
    editorType: layout.editorType ?? 'monaco',
    setEditorType,
  };
}
