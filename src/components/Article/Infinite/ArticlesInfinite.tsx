import { Button, Center, Loader, LoadingOverlay } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { isEqual } from 'lodash-es';
import { useEffect } from 'react';
import { useArticleFilters, useQueryArticles } from '~/components/Article/article.utils';
import { ArticleCard } from '~/components/Cards/ArticleCard';
import { EndOfFeed } from '~/components/EndOfFeed/EndOfFeed';
import { InViewLoader } from '~/components/InView/InViewLoader';
import { MasonryGrid } from '~/components/MasonryColumns/MasonryGrid';
import { NextLink as Link } from '~/components/NextLink/NextLink';
import { NoContent } from '~/components/NoContent/NoContent';
import type { GetInfiniteArticlesSchema } from '~/server/schema/article.schema';
import { removeEmpty } from '~/utils/object-helpers';

export function ArticlesInfinite({
  filters: filterOverrides = {},
  showEof = false,
  showEmptyCta,
  disableStoreFilters,
}: Props) {
  const articlesFilters = useArticleFilters();

  const filters = disableStoreFilters
    ? filterOverrides
    : removeEmpty({ ...articlesFilters, ...filterOverrides });
  const [debouncedFilters, cancel] = useDebouncedValue(filters, 500);

  const { articles, isLoading, fetchNextPage, hasNextPage, isRefetching, isFetching } =
    useQueryArticles(debouncedFilters, { keepPreviousData: true });

  //#region [useEffect] cancel debounced filters
  useEffect(() => {
    if (isEqual(filters, debouncedFilters)) cancel();
  }, [cancel, debouncedFilters, filters]);
  //#endregion

  return (
    <>
      {isLoading ? (
        <Center p="xl">
          <Loader size="xl" />
        </Center>
      ) : !!articles.length ? (
        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={isRefetching ?? false} zIndex={9} />
          <MasonryGrid
            data={articles}
            render={ArticleCard}
            itemId={(x) => x.id}
            empty={<NoContent />}
          />
          {hasNextPage && (
            <InViewLoader
              loadFn={fetchNextPage}
              loadCondition={!isFetching}
              style={{ gridColumn: '1/-1' }}
            >
              <Center p="xl" style={{ height: 36 }} mt="md">
                <Loader />
              </Center>
            </InViewLoader>
          )}
          {!hasNextPage && showEof && <EndOfFeed />}
        </div>
      ) : (
        <NoContent py="lg">
          {showEmptyCta && (
            <Link href="/articles/create">
              <Button radius="xl">Write an Article</Button>
            </Link>
          )}
        </NoContent>
      )}
    </>
  );
}

type Props = {
  filters?: Partial<GetInfiniteArticlesSchema>;
  showEof?: boolean;
  showEmptyCta?: boolean;
  disableStoreFilters?: boolean;
};
