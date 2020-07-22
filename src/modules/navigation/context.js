import React, { createContext } from "react";
import { useLocation } from "@reach/router";
import { useStaticQuery, graphql } from "gatsby";

import { useTranslation } from "@modules/localization/";
import calculateTreeData from "@modules/navigation/calculateTreeData";
import { UrlConverter, getLocaleFromPath } from "@utils";

export const NavigationContext = createContext();

const NavigationProvider = ({ children }) => {
  const { pathname } = useLocation();
  const { locale, t, DEFAULT_LOCALE } = useTranslation();

  const { allMdx } = useStaticQuery(graphql`
    query getNavigationData {
      # Regex for all files that are NOT config files
      allMdx(
        filter: {
          fileAbsolutePath: {
            regex: "//([\\\\w]{2})/(?!header.mdx|index.mdx|sidenav.mdx|example.mdx|social.mdx|footer.mdx|404.mdx|.js|.json)/"
          }
        }
      ) {
        edges {
          node {
            headings(depth: h1) {
              value
            }
            fileAbsolutePath
            frontmatter {
              title
              order
            }
          }
        }
      }
    }
  `);

  let pathDirs = pathname.replace(/\/+$/, "").split("/");
  pathDirs = pathDirs.slice(2, pathDirs.length);

  //NOTE(Rejon): Must be in the shape that React Select expects for it's options.
  const languageSelectorData = allMdx.edges
    .filter(
      ({ node }) =>
        UrlConverter(node).split("/").pop() === pathDirs.slice(-1)[0] &&
        getLocaleFromPath(node.fileAbsolutePath) !== locale
    )
    .map(({ node }) => ({
      value: UrlConverter(node),
      label: t(
        "Language",
        null,
        null,
        getLocaleFromPath(node.fileAbsolutePath)
      ),
    }));

  const { sidenavData, breadcrumbData } = calculateTreeData(
    allMdx.edges,
    pathDirs[0],
    DEFAULT_LOCALE,
    locale,
    pathDirs
  );

  return (
    <NavigationContext.Provider
      value={{
        sidenavData: sidenavData || null,
        breadcrumbData: breadcrumbData || null,
        pathDirs,
        languageSelectorData,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationProvider;