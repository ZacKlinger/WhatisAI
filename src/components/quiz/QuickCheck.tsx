import type { Item } from '@/lib/items';
import ItemView from './ItemView';

/** A single low-stakes question embedded mid-lesson (retrieval practice). */
export default function QuickCheck({ item, title = 'Quick check' }: { item: Item; title?: string }) {
  return (
    <div className="widget">
      <div className="widget-head">
        <div className="widget-title">{title}</div>
        <div className="widget-kicker">Retrieval practice · not scored</div>
      </div>
      <ItemView item={item} compact />
    </div>
  );
}
