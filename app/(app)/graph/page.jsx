import { auth } from '@clerk/nextjs/server';
import { getGraphData } from '@/lib/data/graph';
import GraphClient from './components/GraphClient';

export default async function GraphPage() {
    const { userId } = await auth();
    const data = await getGraphData(userId);

    return <GraphClient initialData={data} />;
}
